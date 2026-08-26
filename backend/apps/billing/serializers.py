from rest_framework import serializers
from .models import Invoice, Payment, Receipt


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ['id', 'payment', 'receipt_number', 'issued_at', 'pdf_file']
        read_only_fields = ['id', 'receipt_number', 'issued_at', 'pdf_file']


class PaymentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)
    receipt = ReceiptSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'date', 'amount', 'payment_type', 'payment_method',
            'reference', 'recorded_by', 'recorded_by_name', 'observation', 'receipt', 'created_at',
        ]
        read_only_fields = ['id', 'recorded_by', 'created_at']

    def validate(self, data):
        invoice = data.get('invoice')
        amount = data.get('amount')
        if invoice and amount is not None and amount > invoice.balance_due:
            raise serializers.ValidationError({
                'amount': f"Le montant dépasse le solde restant ({invoice.balance_due} FCFA)."
            })
        return data


class InvoiceListSerializer(serializers.ModelSerializer):
    reservation_number = serializers.CharField(source='reservation.reservation_number', read_only=True)
    student_name = serializers.CharField(source='reservation.requester.user.full_name', read_only=True)
    amount_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'reservation', 'reservation_number', 'student_name',
            'total_amount', 'amount_paid', 'balance_due', 'status', 'issued_at',
        ]


class InvoiceDetailSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    reservation_number = serializers.CharField(source='reservation.reservation_number', read_only=True)
    hostel_name = serializers.CharField(source='reservation.hostel.name', read_only=True)
    student_name = serializers.CharField(source='reservation.requester.user.full_name', read_only=True)
    room_number = serializers.CharField(source='reservation.room.number', read_only=True)
    amount_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'reservation', 'reservation_number', 'hostel_name',
            'student_name', 'room_number', 'stay_amount', 'additional_fees', 'deposit_amount',
            'total_amount', 'planned_installments', 'status', 'pdf_file', 'notes',
            'amount_paid', 'balance_due', 'payments', 'issued_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'invoice_number', 'reservation', 'stay_amount', 'total_amount',
            'payments', 'issued_at', 'created_at', 'updated_at',
        ]
