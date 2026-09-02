from rest_framework import serializers

from .models import CashBox, CashMovement, Expense, ExpenseCategory


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name']


class ExpenseSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'hostel', 'hostel_name', 'category', 'category_name',
            'amount', 'date', 'description', 'receipt_file',
            'recorded_by', 'recorded_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'recorded_by', 'created_at', 'updated_at']


class CashMovementSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)

    class Meta:
        model = CashMovement
        fields = [
            'id', 'movement_type', 'amount', 'date', 'description',
            'hostel', 'hostel_name', 'payment', 'expense',
            'recorded_by', 'recorded_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'payment', 'expense', 'recorded_by', 'created_at']

    def validate_movement_type(self, value):
        # payment_in / expense_out ne sont créés que côté serveur (via
        # apps.cashbox.services.record_movement, appelé depuis PaymentViewSet /
        # ExpenseViewSet) — la saisie manuelle via l'API se limite aux
        # approvisionnements et ajustements.
        if value not in (CashMovement.Type.DEPOSIT, CashMovement.Type.ADJUSTMENT):
            raise serializers.ValidationError(
                "Seuls les types 'Approvisionnement' et 'Ajustement manuel' peuvent être saisis directement."
            )
        return value


class CashBoxSummarySerializer(serializers.Serializer):
    balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_in = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_out = serializers.DecimalField(max_digits=14, decimal_places=2)
    movements_count = serializers.IntegerField()
    updated_at = serializers.DateTimeField()
