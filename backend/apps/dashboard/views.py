from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.authentication.permissions import IsStaff
from apps.hostels.models import Hostel, Room
from apps.reservations.models import Reservation, Student
from apps.reservations.services import sync_all_pending_room_occupancy
from apps.billing.models import Invoice, Payment


class DashboardStatsView(APIView):
    """Indicateurs clés du tableau de bord admin (section 16 du cahier des charges)."""

    permission_classes = [IsStaff]

    def get(self, request):
        # Rattrapage : bascule les chambres dont la date d'arrivée est atteinte
        # et qui ont déjà reçu un paiement (au cas où personne n'a déclenché
        # la vérification depuis, ex. paiement enregistré avant l'arrivée).
        sync_all_pending_room_occupancy()

        hostels = Hostel.objects.filter(is_active=True)
        rooms = Room.objects.all()

        # États administratifs de la chambre (maintenance/hors service/bloquée) —
        # indépendants de l'occupation, qui est calculée par lit ci-dessous.
        total_rooms = rooms.count()
        available_rooms = rooms.filter(status=Room.Status.AVAILABLE).count()
        maintenance_rooms = rooms.filter(status=Room.Status.MAINTENANCE).count()
        out_of_service_rooms = rooms.filter(status=Room.Status.OUT_OF_SERVICE).count()
        blocked_rooms = rooms.filter(status=Room.Status.BLOCKED).count()

        # Occupation par lit — l'unité de facturation réelle.
        total_beds = rooms.aggregate(total=Sum('beds_count'))['total'] or 0
        beds_taken = Reservation.objects.filter(
            status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED]
        ).aggregate(total=Sum('beds_reserved'))['total'] or 0
        beds_available = max(total_beds - beds_taken, 0)
        occupancy_rate = round((beds_taken / total_beds) * 100, 1) if total_beds else 0

        reservations = Reservation.objects.all()
        pending_reservations = reservations.filter(status=Reservation.Status.PENDING).count()
        confirmed_reservations = reservations.filter(
            status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED]
        ).count()
        rejected_reservations = reservations.filter(status=Reservation.Status.REJECTED).count()

        total_tenants = Student.objects.filter(
            reservations__status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED]
        ).distinct().count()

        invoiced_amount = Invoice.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        collected_amount = Payment.objects.aggregate(total=Sum('amount'))['total'] or 0
        outstanding_amount = invoiced_amount - collected_amount

        rooms_by_status = {
            choice_value: rooms.filter(status=choice_value).count()
            for choice_value, _ in Room.Status.choices
        }

        by_hostel = []
        for hostel in hostels:
            h_total = hostel.rooms.count()
            h_total_beds = hostel.rooms.aggregate(total=Sum('beds_count'))['total'] or 0
            h_beds_taken = Reservation.objects.filter(
                hostel=hostel, status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED]
            ).aggregate(total=Sum('beds_reserved'))['total'] or 0
            h_invoiced = Invoice.objects.filter(reservation__hostel=hostel).aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            h_revenue = Payment.objects.filter(
                invoice__reservation__hostel=hostel
            ).aggregate(total=Sum('amount'))['total'] or 0
            by_hostel.append({
                'hostel_id': hostel.id,
                'hostel_name': hostel.name,
                'total_rooms': h_total,
                'total_beds': h_total_beds,
                'beds_taken': h_beds_taken,
                'beds_available': max(h_total_beds - h_beds_taken, 0),
                'occupancy_rate': round((h_beds_taken / h_total_beds) * 100, 1) if h_total_beds else 0,
                'invoiced': h_invoiced,
                'revenue': h_revenue,
            })

        return Response({
            'total_hostels': hostels.count(),
            'total_rooms': total_rooms,
            'available_rooms': available_rooms,
            'maintenance_rooms': maintenance_rooms,
            'out_of_service_rooms': out_of_service_rooms,
            'blocked_rooms': blocked_rooms,
            'total_beds': total_beds,
            'beds_taken': beds_taken,
            'beds_available': beds_available,
            'occupancy_rate': occupancy_rate,
            'rooms_by_status': rooms_by_status,
            'pending_reservations': pending_reservations,
            'confirmed_reservations': confirmed_reservations,
            'rejected_reservations': rejected_reservations,
            'total_tenants': total_tenants,
            'invoiced_amount': invoiced_amount,
            'collected_amount': collected_amount,
            'outstanding_amount': outstanding_amount,
            'by_hostel': by_hostel,
        })
