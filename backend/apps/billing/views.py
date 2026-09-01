from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.notifications.models import Notification
from apps.notifications.services import notify
from apps.reservations.services import sync_room_occupancy_for_reservation
from .models import Invoice, Payment, Receipt
from .pdf import generate_receipt_pdf
from .permissions import IsStaffOrOwnerReadOnly
from .serializers import (
    InvoiceListSerializer, InvoiceDetailSerializer, PaymentSerializer, ReceiptSerializer,
)


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrOwnerReadOnly]
    http_method_names = ['get', 'patch', 'head', 'options']
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'reservation', 'reservation__hostel']
    search_fields = ['invoice_number', 'reservation__reservation_number', 'reservation__requester__user__full_name']

    def get_queryset(self):
        queryset = Invoice.objects.select_related(
            'reservation__hostel', 'reservation__room', 'reservation__requester__user'
        ).prefetch_related('payments')
        user = self.request.user
        if user.is_student_role:
            return queryset.filter(reservation__requester__user=user)
        if user.is_manager:
            return queryset.filter(reservation__hostel__in=user.hostels.all())
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceDetailSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrOwnerReadOnly]
    serializer_class = PaymentSerializer
    http_method_names = ['get', 'post', 'head', 'options']
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['invoice', 'payment_type', 'payment_method']

    def get_queryset(self):
        queryset = Payment.objects.select_related('invoice', 'recorded_by')
        user = self.request.user
        if user.is_student_role:
            return queryset.filter(invoice__reservation__requester__user=user)
        if user.is_manager:
            return queryset.filter(invoice__reservation__hostel__in=user.hostels.all())
        return queryset

    def perform_create(self, serializer):
        payment = serializer.save(recorded_by=self.request.user)
        receipt = Receipt.objects.create(payment=payment)
        generate_receipt_pdf(receipt)

        invoice = payment.invoice
        student_user = invoice.reservation.requester.user
        notify(
            student_user,
            Notification.Type.PAYMENT_CONFIRMED,
            'Confirmation de paiement',
            f"Votre paiement de {payment.amount} a été enregistré. "
            f"Montant total : {invoice.total_amount}. Montant payé : {invoice.amount_paid}. "
            f"Solde restant : {invoice.balance_due}.",
            reservation=invoice.reservation,
        )
        if invoice.balance_due <= 0 and invoice.status != Invoice.Status.PAID:
            invoice.status = Invoice.Status.PAID
            invoice.save(update_fields=['status'])
        elif invoice.balance_due > 0:
            notify(
                student_user,
                Notification.Type.BALANCE_REMAINING,
                'Solde restant à payer',
                f"Il vous reste {invoice.balance_due} à régler sur la facture {invoice.invoice_number}.",
                reservation=invoice.reservation,
            )

        # Un paiement (même partiel) déclenche le passage de la chambre en
        # 'Occupée' si la date d'arrivée souhaitée est déjà atteinte.
        sync_room_occupancy_for_reservation(invoice.reservation)


class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsStaffOrOwnerReadOnly]
    serializer_class = ReceiptSerializer

    def get_queryset(self):
        queryset = Receipt.objects.select_related('payment')
        user = self.request.user
        if user.is_student_role:
            return queryset.filter(payment__invoice__reservation__requester__user=user)
        if user.is_manager:
            return queryset.filter(payment__invoice__reservation__hostel__in=user.hostels.all())
        return queryset
