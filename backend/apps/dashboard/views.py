from django.db.models import Sum, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.authentication.permissions import IsStaff
from apps.hostels.models import Hostel, Room
from apps.reservations.models import Reservation, Student
from apps.billing.models import Invoice, Payment


class DashboardStatsView(APIView):
    """Indicateurs clés du tableau de bord admin (section 16 du cahier des charges)."""

    permission_classes = [IsStaff]

    def get(self, request):
        hostels = Hostel.objects.filter(is_active=True)
        rooms = Room.objects.all()

        total_rooms = rooms.count()
        occupied_rooms = rooms.filter(status=Room.Status.OCCUPIED).count()
        available_rooms = rooms.filter(status=Room.Status.AVAILABLE).count()
        maintenance_rooms = rooms.filter(status=Room.Status.MAINTENANCE).count()
        out_of_service_rooms = rooms.filter(status=Room.Status.OUT_OF_SERVICE).count()
        lettable_rooms = total_rooms - out_of_service_rooms
        occupancy_rate = round((occupied_rooms / lettable_rooms) * 100, 1) if lettable_rooms else 0

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
            h_occupied = hostel.rooms.filter(status=Room.Status.OCCUPIED).count()
            h_out_of_service = hostel.rooms.filter(status=Room.Status.OUT_OF_SERVICE).count()
            h_lettable = h_total - h_out_of_service
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
                'occupied_rooms': h_occupied,
                'occupancy_rate': round((h_occupied / h_lettable) * 100, 1) if h_lettable else 0,
                'invoiced': h_invoiced,
                'revenue': h_revenue,
            })

        return Response({
            'total_hostels': hostels.count(),
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'available_rooms': available_rooms,
            'maintenance_rooms': maintenance_rooms,
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
