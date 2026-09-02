from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from openpyxl import Workbook
from openpyxl.styles import Font
from rest_framework.views import APIView

from apps.authentication.permissions import IsStaff
from apps.hostels.models import Hostel, Room
from apps.reservations.models import Reservation, Student
from apps.billing.models import Invoice, Payment


def _xlsx_response(filename, headers, rows):
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)
    for row in rows:
        ws.append(row)
    for col in ws.columns:
        width = max((len(str(c.value)) for c in col if c.value is not None), default=10)
        ws.column_dimensions[col[0].column_letter].width = min(max(width + 2, 10), 40)

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    wb.save(response)
    return response


class RoomsReportView(APIView):
    """Rapport opérationnel : liste des chambres (section 23)."""

    permission_classes = [IsStaff]

    def get(self, request):
        rooms = Room.objects.select_related('hostel', 'zone', 'room_type', 'comfort').order_by(
            'hostel__name', 'number'
        )
        status_filter = request.query_params.get('status')
        if status_filter:
            rooms = rooms.filter(status=status_filter)

        rows = []
        for r in rooms:
            price = r.current_price
            rows.append([
                r.hostel.name, r.zone.name if r.zone else '', r.number, r.room_type.name,
                r.comfort.name, r.beds_count, r.beds_taken, r.beds_available,
                r.get_status_display(), r.get_electricity_policy_display(),
                float(price.monthly_rate) if price else '',
            ])

        return _xlsx_response(
            'chambres.xlsx',
            [
                'Hostel', 'Zone/Bloc', 'Numéro', 'Type', 'Confort',
                'Lits', 'Lits occupés', 'Lits libres',
                'Statut', 'Électricité', 'Tarif mensuel/lit (FCFA)',
            ],
            rows,
        )


class ReservationsReportView(APIView):
    """Rapport opérationnel : liste des réservations (section 23)."""

    permission_classes = [IsStaff]

    def get(self, request):
        reservations = Reservation.objects.select_related(
            'requester__user', 'hostel', 'room'
        ).order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter:
            reservations = reservations.filter(status=status_filter)

        rows = [
            [
                res.reservation_number, res.requester.user.full_name, res.requester.user.email,
                res.hostel.name, res.room.number if res.room else '', res.get_status_display(),
                res.desired_start_date.isoformat() if res.desired_start_date else '',
                res.created_at.strftime('%Y-%m-%d %H:%M'),
            ]
            for res in reservations
        ]

        return _xlsx_response(
            'reservations.xlsx',
            ['Référence', 'Étudiant', 'Email', 'Hostel', 'Chambre', 'Statut', "Date d'entrée souhaitée", 'Soumise le'],
            rows,
        )


class TenantsReportView(APIView):
    """Rapport opérationnel : liste des locataires (section 23)."""

    permission_classes = [IsStaff]

    def get(self, request):
        students = Student.objects.filter(
            reservations__status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED]
        ).distinct().select_related('user').prefetch_related('reservations__hostel', 'reservations__room')

        today = timezone.localdate()
        rows = []
        for s in students:
            active = s.reservations.filter(
                status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED]
            ).select_related('hostel', 'room').first()
            days_remaining = (active.desired_end_date - today).days if active and active.desired_end_date else ''
            rows.append([
                s.user.full_name, s.user.email, s.user.phone_number, s.nationality, s.program,
                active.hostel.name if active else '',
                active.room.number if active and active.room else '',
                active.beds_reserved if active else '',
                active.desired_start_date.isoformat() if active and active.desired_start_date else '',
                active.desired_end_date.isoformat() if active and active.desired_end_date else '',
                days_remaining,
            ])

        return _xlsx_response(
            'locataires.xlsx',
            [
                'Nom', 'Email', 'Téléphone', 'Nationalité', 'Programme', 'Hostel', 'Chambre', 'Lits',
                "Date d'entrée", 'Date de sortie', 'Jours restants',
            ],
            rows,
        )


class RevenueReportView(APIView):
    """Rapport financier : facturation / encaissements / impayés par hostel (section 23)."""

    permission_classes = [IsStaff]

    def get(self, request):
        rows = []
        for hostel in Hostel.objects.all():
            invoiced = Invoice.objects.filter(reservation__hostel=hostel).aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            collected = Payment.objects.filter(invoice__reservation__hostel=hostel).aggregate(
                total=Sum('amount')
            )['total'] or 0
            rows.append([hostel.name, float(invoiced), float(collected), float(invoiced) - float(collected)])

        return _xlsx_response(
            f'revenus_{timezone.now():%Y%m%d}.xlsx',
            ['Hostel', 'Montant facturé (FCFA)', 'Montant encaissé (FCFA)', 'Impayés (FCFA)'],
            rows,
        )
