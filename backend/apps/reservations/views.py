import os
import uuid

from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.authentication.models import User
from apps.authentication.permissions import IsStaff
from apps.hostels.models import Room
from apps.notifications.models import Notification
from apps.notifications.services import notify
from .models import Student, Reservation, CheckIn, CheckOut
from .serializers import (
    StudentSerializer, StudentUpdateSerializer,
    ReservationListSerializer, ReservationDetailSerializer, ReservationCreateSerializer,
    RejectReservationSerializer, ProposeAlternativeSerializer, AlternativeResponseSerializer,
    CheckInSerializer, CheckOutSerializer,
)


class MyStudentProfileView(APIView):
    """Consultation/mise à jour du profil académique de l'étudiant connecté."""

    permission_classes = [IsAuthenticated]

    def _get_profile(self, request):
        profile, _ = Student.objects.get_or_create(user=request.user)
        return profile

    def get(self, request):
        return Response(StudentSerializer(self._get_profile(request)).data)

    def patch(self, request):
        profile = self._get_profile(request)
        serializer = StudentUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(StudentSerializer(profile).data)


class MyStudentDocumentsView(APIView):
    """Upload / suppression des documents justificatifs de l'étudiant connecté
    (section 10 du cahier des charges)."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def _get_profile(self, request):
        profile, _ = Student.objects.get_or_create(user=request.user)
        return profile

    def post(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'Aucun fichier reçu.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(upload.name)[1].lower()
        if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
            return Response(
                {'detail': f"Format non autorisé. Formats acceptés : {', '.join(settings.ALLOWED_UPLOAD_EXTENSIONS)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if upload.content_type not in settings.ALLOWED_UPLOAD_MIME_TYPES:
            return Response({'detail': 'Type de fichier non autorisé.'}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
            return Response({'detail': 'Fichier trop volumineux (5 Mo maximum).'}, status=status.HTTP_400_BAD_REQUEST)

        profile = self._get_profile(request)
        doc_id = uuid.uuid4().hex
        path = default_storage.save(
            f'student_documents/{request.user.id}/{doc_id}{ext}', upload
        )
        entry = {
            'id': doc_id,
            'name': upload.name,
            'url': default_storage.url(path),
            'uploaded_at': timezone.now().isoformat(),
        }
        profile.documents = [*profile.documents, entry]
        profile.save(update_fields=['documents'])
        return Response(StudentSerializer(profile).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        doc_id = request.query_params.get('id')
        profile = self._get_profile(request)
        target = next((d for d in profile.documents if d.get('id') == doc_id), None)
        if not target:
            return Response({'detail': 'Document introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            relative_path = target['url'].replace(settings.MEDIA_URL, '', 1)
            if default_storage.exists(relative_path):
                default_storage.delete(relative_path)
        except Exception:
            pass

        profile.documents = [d for d in profile.documents if d.get('id') != doc_id]
        profile.save(update_fields=['documents'])
        return Response(StudentSerializer(profile).data)


def _other_beds_taken(room, reservation):
    """Lits déjà engagés sur cette chambre par d'AUTRES réservations actives
    (accepted/confirmed) — sert à valider une affectation sans compter deux
    fois la réservation qu'on est en train de traiter."""
    return room.reservations.filter(
        status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED]
    ).exclude(pk=reservation.pk).aggregate(total=Sum('beds_reserved'))['total'] or 0


class ReservationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['hostel', 'status']
    search_fields = ['reservation_number', 'requester__user__full_name', 'requester__user__email']
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        queryset = Reservation.objects.select_related(
            'requester__user', 'hostel', 'room', 'alternative_hostel', 'alternative_room'
        ).prefetch_related('members')
        if user.is_student_role:
            return queryset.filter(requester__user=user)
        if user.is_manager:
            return queryset.filter(hostel__in=user.hostels.all())
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        if self.action == 'list':
            return ReservationListSerializer
        return ReservationDetailSerializer

    def create(self, request, *args, **kwargs):
        if not request.user.is_student_role:
            return Response(
                {'detail': 'Seul un compte étudiant peut soumettre une demande de réservation.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        response = super().create(request, *args, **kwargs)
        response.data = ReservationDetailSerializer(self._created_reservation).data
        return response

    def perform_create(self, serializer):
        reservation = serializer.save()
        self._created_reservation = reservation
        notify(
            reservation.requester.user,
            Notification.Type.RESERVATION_REQUEST_RECEIVED,
            'Demande de réservation reçue',
            f"Votre demande {reservation.reservation_number} pour {reservation.hostel.name} "
            "a bien été reçue et est en attente de validation.",
            reservation=reservation,
        )
        for admin_user in User.objects.filter(role=User.Role.ADMIN, is_active=True):
            notify(
                admin_user,
                Notification.Type.RESERVATION_PENDING,
                'Nouvelle demande de réservation',
                f"{reservation.requester.user.full_name} a soumis la demande "
                f"{reservation.reservation_number} pour {reservation.hostel.name}.",
                reservation=reservation,
            )

    @action(detail=False, methods=['get'], permission_classes=[IsStaff])
    def tenants(self, request):
        """Étudiants ayant une réservation active avec chambre assignée — pour le
        suivi des locataires (durée, date de fin, jours restants, relance).

        Par défaut : séjours en cours (date de fin non atteinte, ou non renseignée).
        ?ended=true : historique des séjours dont la date de fin est déjà passée."""
        from django.db.models import F

        base = self.get_queryset().filter(
            status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED], room__isnull=False
        )
        today = timezone.localdate()
        if request.query_params.get('ended') == 'true':
            queryset = base.filter(desired_end_date__lt=today).order_by('-desired_end_date')
        else:
            queryset = base.filter(
                Q(desired_end_date__isnull=True) | Q(desired_end_date__gte=today)
            ).order_by(F('desired_end_date').asc(nulls_last=True))

        queryset = self.filter_queryset(queryset)
        page = self.paginate_queryset(queryset)
        serializer = ReservationListSerializer(page if page is not None else queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def accept(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status != Reservation.Status.PENDING:
            return Response({'detail': 'Cette demande a déjà été traitée.'}, status=400)

        room_id = request.data.get('room')
        room = reservation.room
        if room_id:
            room = Room.objects.filter(pk=room_id, hostel=reservation.hostel).first()
            if not room:
                return Response({'detail': 'Chambre invalide pour cet hostel.'}, status=400)
        if not room:
            return Response({'detail': 'Aucune chambre sélectionnée pour cette réservation.'}, status=400)

        if room.status != Room.Status.AVAILABLE:
            return Response(
                {'detail': f"Chambre indisponible ({room.get_status_display()})."}, status=400
            )

        beds_reserved = int(request.data.get('beds_reserved') or reservation.beds_reserved or 1)
        already_taken = _other_beds_taken(room, reservation)
        if already_taken + beds_reserved > room.beds_count:
            remaining = max(room.beds_count - already_taken, 0)
            return Response(
                {'detail': f"Plus que {remaining} lit(s) disponible(s) dans cette chambre."}, status=400
            )

        reservation.room = room
        reservation.beds_reserved = beds_reserved
        reservation.status = Reservation.Status.ACCEPTED
        reservation.handled_by = request.user
        reservation.decided_at = timezone.now()
        reservation.save()

        from apps.billing.services import generate_proforma_invoice
        invoice = generate_proforma_invoice(reservation)

        notify(
            reservation.requester.user,
            Notification.Type.RESERVATION_ACCEPTED,
            'Réservation acceptée',
            f"Votre réservation {reservation.reservation_number} a été acceptée. "
            f"Chambre {room.number} – {reservation.hostel.name}.",
            reservation=reservation,
        )
        notify(
            reservation.requester.user,
            Notification.Type.INVOICE_GENERATED,
            'Facture pro-forma disponible',
            f"La facture {invoice.invoice_number} d'un montant de {invoice.total_amount} "
            "a été générée pour votre réservation.",
            reservation=reservation,
        )

        return Response(ReservationDetailSerializer(reservation).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def reject(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status != Reservation.Status.PENDING:
            return Response({'detail': 'Cette demande a déjà été traitée.'}, status=400)

        serializer = RejectReservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reservation.status = Reservation.Status.REJECTED
        reservation.rejection_reason = serializer.validated_data['reason']
        reservation.handled_by = request.user
        reservation.decided_at = timezone.now()
        reservation.save()

        notify(
            reservation.requester.user,
            Notification.Type.RESERVATION_REJECTED,
            'Réservation rejetée',
            f"Votre réservation {reservation.reservation_number} a été rejetée. "
            f"Motif : {reservation.rejection_reason}",
            reservation=reservation,
        )
        return Response(ReservationDetailSerializer(reservation).data)

    @action(detail=True, methods=['post'], url_path='propose-alternative', permission_classes=[IsStaff])
    def propose_alternative(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status not in (Reservation.Status.PENDING, Reservation.Status.ALTERNATIVE_REJECTED):
            return Response({'detail': 'Cette demande ne peut pas recevoir de nouvelle proposition.'}, status=400)

        serializer = ProposeAlternativeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        reservation.alternative_hostel = data.get('alternative_hostel')
        reservation.alternative_room = data.get('alternative_room')
        reservation.alternative_external_residence = data.get('alternative_external_residence')
        reservation.alternative_note = data.get('note', '')
        reservation.status = Reservation.Status.ALTERNATIVE_PROPOSED
        reservation.handled_by = request.user
        reservation.decided_at = timezone.now()
        reservation.save()

        notify(
            reservation.requester.user,
            Notification.Type.ALTERNATIVE_PROPOSED,
            'Proposition de chambre alternative',
            f"Une alternative vous est proposée pour votre demande {reservation.reservation_number}. "
            "Connectez-vous à votre espace pour accepter, refuser ou demander une autre proposition.",
            reservation=reservation,
        )
        return Response(ReservationDetailSerializer(reservation).data)

    @action(detail=True, methods=['post'], url_path='respond-alternative')
    def respond_alternative(self, request, pk=None):
        reservation = self.get_object()
        if reservation.requester.user != request.user:
            return Response({'detail': 'Non autorisé.'}, status=403)
        if reservation.status != Reservation.Status.ALTERNATIVE_PROPOSED:
            return Response({'detail': 'Aucune alternative en attente de réponse.'}, status=400)

        serializer = AlternativeResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        decision = serializer.validated_data['decision']

        if decision == 'accept':
            room = reservation.alternative_room
            if room:
                if room.status != Room.Status.AVAILABLE:
                    return Response(
                        {'detail': f"Chambre indisponible ({room.get_status_display()})."}, status=400
                    )
                beds_reserved = reservation.beds_reserved or 1
                already_taken = _other_beds_taken(room, reservation)
                if already_taken + beds_reserved > room.beds_count:
                    remaining = max(room.beds_count - already_taken, 0)
                    return Response(
                        {'detail': f"Plus que {remaining} lit(s) disponible(s) dans cette chambre."}, status=400
                    )
                reservation.beds_reserved = beds_reserved

            reservation.hostel = reservation.alternative_hostel or reservation.hostel
            reservation.room = room
            reservation.status = Reservation.Status.ACCEPTED
            reservation.decided_at = timezone.now()
            reservation.save()
            from apps.billing.services import generate_proforma_invoice
            invoice = generate_proforma_invoice(reservation)
            notify(
                reservation.requester.user,
                Notification.Type.RESERVATION_ACCEPTED,
                'Réservation confirmée',
                f"Votre réservation {reservation.reservation_number} est confirmée. "
                f"Facture {invoice.invoice_number} disponible dans votre espace.",
                reservation=reservation,
            )
        elif decision == 'refuse':
            reservation.status = Reservation.Status.REJECTED
            reservation.rejection_reason = "Alternative refusée par l'étudiant."
            reservation.save()
        else:  # request_other
            reservation.status = Reservation.Status.ALTERNATIVE_REJECTED
            reservation.save()

        return Response(ReservationDetailSerializer(reservation).data)


class CheckInViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaff]
    serializer_class = CheckInSerializer
    queryset = CheckIn.objects.select_related('reservation').all()

    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)


class CheckOutViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaff]
    serializer_class = CheckOutSerializer
    queryset = CheckOut.objects.select_related('reservation').all()

    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)
