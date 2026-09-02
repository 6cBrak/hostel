from django.db import transaction
from django.db.models import Case, DecimalField, F, Sum, When
from django.utils import timezone

from .models import CashBox, CashMovement


def recompute_balance():
    """Recalcule CashBox.balance à partir de la somme de tous les CashMovement
    (deposit/payment_in en +, expense_out en -, adjustment tel quel — signé).

    Recalculer entièrement plutôt que de maintenir un delta incrémental élimine
    tout risque de dérive du solde lors de la modification/suppression a
    posteriori d'un mouvement (dépense corrigée, mouvement supprimé...)."""
    total = CashMovement.objects.aggregate(
        total=Sum(
            Case(
                When(movement_type__in=[CashMovement.Type.DEPOSIT, CashMovement.Type.PAYMENT_IN], then=F('amount')),
                When(movement_type=CashMovement.Type.EXPENSE_OUT, then=-F('amount')),
                When(movement_type=CashMovement.Type.ADJUSTMENT, then=F('amount')),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        )
    )['total'] or 0

    box = CashBox.load()
    box.balance = total
    box.save(update_fields=['balance', 'updated_at'])
    return box.balance


@transaction.atomic
def record_movement(
    movement_type, amount, *, date=None, description='', payment=None, expense=None, hostel=None, recorded_by=None
):
    """Crée un CashMovement puis recalcule le solde de la caisse."""
    movement = CashMovement.objects.create(
        movement_type=movement_type,
        amount=amount,
        date=date or timezone.localdate(),
        description=description,
        payment=payment,
        expense=expense,
        hostel=hostel,
        recorded_by=recorded_by,
    )
    recompute_balance()
    return movement
