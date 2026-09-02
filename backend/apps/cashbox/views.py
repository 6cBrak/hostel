from django.db.models import Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.mixins import ProtectedDestroyMixin
from .models import CashBox, CashMovement, Expense, ExpenseCategory
from .permissions import IsFinanceStaff
from .serializers import (
    CashBoxSummarySerializer, CashMovementSerializer, ExpenseSerializer, ExpenseCategorySerializer,
)
from .services import record_movement, recompute_balance


class ExpenseCategoryViewSet(ProtectedDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [IsFinanceStaff]
    serializer_class = ExpenseCategorySerializer
    search_fields = ['name']
    queryset = ExpenseCategory.objects.all()


class ExpenseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsFinanceStaff]
    serializer_class = ExpenseSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['hostel', 'category']
    search_fields = ['description', 'hostel__name', 'category__name']
    ordering_fields = ['date', 'amount', 'created_at']
    queryset = Expense.objects.select_related('hostel', 'category', 'recorded_by')

    def perform_create(self, serializer):
        expense = serializer.save(recorded_by=self.request.user)
        record_movement(
            CashMovement.Type.EXPENSE_OUT, expense.amount,
            date=expense.date, description=expense.description or expense.category.name,
            expense=expense, hostel=expense.hostel, recorded_by=self.request.user,
        )

    def perform_update(self, serializer):
        expense = serializer.save()
        movement = expense.cash_movements.first()
        if movement is None:
            record_movement(
                CashMovement.Type.EXPENSE_OUT, expense.amount,
                date=expense.date, description=expense.description or expense.category.name,
                expense=expense, hostel=expense.hostel, recorded_by=self.request.user,
            )
            return
        movement.amount = expense.amount
        movement.date = expense.date
        movement.description = expense.description or expense.category.name
        movement.hostel = expense.hostel
        movement.save(update_fields=['amount', 'date', 'description', 'hostel'])
        recompute_balance()

    def perform_destroy(self, instance):
        instance.cash_movements.all().delete()
        instance.delete()
        recompute_balance()


class CashMovementViewSet(viewsets.ModelViewSet):
    """Historique complet des mouvements. La création directe via l'API ne
    couvre que les approvisionnements/ajustements manuels — les mouvements
    payment_in/expense_out sont générés côté serveur (voir ExpenseViewSet et
    apps.billing.views.PaymentViewSet)."""

    permission_classes = [IsFinanceStaff]
    serializer_class = CashMovementSerializer
    http_method_names = ['get', 'post', 'head', 'options']
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['movement_type', 'hostel']
    search_fields = ['description']
    ordering_fields = ['date', 'amount', 'created_at']
    queryset = CashMovement.objects.select_related('hostel', 'recorded_by', 'payment', 'expense')

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
        recompute_balance()


class CashBoxSummaryView(APIView):
    permission_classes = [IsFinanceStaff]

    def get(self, request):
        box = CashBox.load()
        totals = CashMovement.objects.aggregate(
            total_in=Sum(
                'amount', filter=Q(movement_type__in=[CashMovement.Type.DEPOSIT, CashMovement.Type.PAYMENT_IN])
            ),
            total_out=Sum('amount', filter=Q(movement_type=CashMovement.Type.EXPENSE_OUT)),
        )
        data = {
            'balance': box.balance,
            'total_in': totals['total_in'] or 0,
            'total_out': totals['total_out'] or 0,
            'movements_count': CashMovement.objects.count(),
            'updated_at': box.updated_at,
        }
        return Response(CashBoxSummarySerializer(data).data)
