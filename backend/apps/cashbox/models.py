from django.conf import settings
from django.db import models
from django.utils import timezone


class ExpenseCategory(models.Model):
    """Catégorie de dépense — référentiel libre paramétrable (comme RoomType/Amenity)."""

    name = models.CharField(max_length=80, unique=True, verbose_name='Catégorie')

    class Meta:
        db_table = 'expense_categories'
        verbose_name = 'Catégorie de dépense'
        verbose_name_plural = 'Catégories de dépense'
        ordering = ['name']

    def __str__(self):
        return self.name


class CashBox(models.Model):
    """Caisse unique globale (singleton, même pattern que SiteSettings).

    Le solde n'est jamais modifié à la main : il est recalculé depuis la somme
    des CashMovement à chaque écriture (voir services.recompute_balance)."""

    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='Solde')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cashbox'
        verbose_name = 'Caisse'
        verbose_name_plural = 'Caisse'

    def __str__(self):
        return f'Caisse — solde {self.balance}'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Expense(models.Model):
    """Dépense rattachée à un hostel (parties communes, chambres, entretien...)."""

    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.PROTECT, related_name='expenses')
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name='expenses')
    amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='Montant')
    date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True)
    receipt_file = models.FileField(upload_to='expenses/', blank=True, null=True, verbose_name='Justificatif')
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        verbose_name = 'Dépense'
        verbose_name_plural = 'Dépenses'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.hostel.name} – {self.category.name} : {self.amount}'


class CashMovement(models.Model):
    """Journal des mouvements de caisse — source de vérité du solde (CashBox.balance
    est recalculé à partir de la somme de ces lignes, jamais modifié directement)."""

    class Type(models.TextChoices):
        DEPOSIT = 'deposit', 'Approvisionnement'
        PAYMENT_IN = 'payment_in', 'Encaissement (paiement locataire)'
        EXPENSE_OUT = 'expense_out', 'Sortie (dépense)'
        ADJUSTMENT = 'adjustment', 'Ajustement manuel'

    movement_type = models.CharField(max_length=15, choices=Type.choices, verbose_name='Type')
    amount = models.DecimalField(
        max_digits=14, decimal_places=2, verbose_name='Montant',
        help_text="Toujours positif, sauf pour un ajustement qui peut être négatif.",
    )
    date = models.DateField(default=timezone.now)
    description = models.CharField(max_length=255, blank=True)
    hostel = models.ForeignKey(
        'hostels.Hostel', on_delete=models.SET_NULL, null=True, blank=True, related_name='cash_movements',
        help_text="Renseigné automatiquement quand le mouvement provient d'un paiement ou d'une dépense.",
    )
    payment = models.ForeignKey(
        'billing.Payment', on_delete=models.SET_NULL, null=True, blank=True, related_name='cash_movements'
    )
    expense = models.ForeignKey(
        Expense, on_delete=models.SET_NULL, null=True, blank=True, related_name='cash_movements'
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cash_movements'
        verbose_name = 'Mouvement de caisse'
        verbose_name_plural = 'Mouvements de caisse'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.get_movement_type_display()} – {self.amount} ({self.date})'
