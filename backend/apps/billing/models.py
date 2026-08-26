from django.conf import settings
from django.db import models
from django.utils import timezone


class Invoice(models.Model):
    class Status(models.TextChoices):
        ISSUED = 'issued', 'Émise'
        PAID = 'paid', 'Soldée'
        CANCELLED = 'cancelled', 'Annulée'

    invoice_number = models.CharField(max_length=30, unique=True, blank=True)
    reservation = models.OneToOneField(
        'reservations.Reservation', on_delete=models.CASCADE, related_name='invoice'
    )

    stay_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Montant du séjour')
    additional_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Frais supplémentaires')
    deposit_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='Caution'
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Montant total')

    planned_installments = models.JSONField(
        default=list, blank=True,
        help_text='Échéancier indicatif : [{"label": "Acompte", "amount": .., "due_date": ".."}, ...].',
    )

    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ISSUED)
    pdf_file = models.FileField(upload_to='invoices/', blank=True, null=True)
    notes = models.TextField(blank=True)

    issued_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        verbose_name = 'Facture'
        verbose_name_plural = 'Factures'
        ordering = ['-issued_at']

    def __str__(self):
        return self.invoice_number or f'Facture #{self.pk}'

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self._generate_invoice_number()
        super().save(*args, **kwargs)

    def _generate_invoice_number(self):
        year = timezone.now().year
        last = Invoice.objects.filter(
            invoice_number__startswith=f'INV-{year}-'
        ).order_by('-id').first()
        sequence = 1
        if last:
            try:
                sequence = int(last.invoice_number.rsplit('-', 1)[-1]) + 1
            except ValueError:
                pass
        return f'INV-{year}-{sequence:05d}'

    @property
    def amount_paid(self):
        return self.payments.aggregate(total=models.Sum('amount'))['total'] or 0

    @property
    def balance_due(self):
        return self.total_amount - self.amount_paid


class Payment(models.Model):
    class PaymentType(models.TextChoices):
        DEPOSIT = 'deposit', 'Acompte'
        SECOND_INSTALLMENT = 'second_installment', 'Deuxième tranche'
        BALANCE = 'balance', 'Solde'
        OTHER = 'other', 'Autre'

    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Espèces'
        BANK_TRANSFER = 'bank_transfer', 'Virement bancaire'
        MOBILE_MONEY = 'mobile_money', 'Mobile money'
        ONLINE = 'online', 'Paiement en ligne'
        OTHER = 'other', 'Autre'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    date = models.DateField(default=timezone.now)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=25, choices=PaymentType.choices, default=PaymentType.OTHER)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    reference = models.CharField(max_length=100, blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    observation = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.amount} – {self.invoice.invoice_number}'


class Receipt(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    receipt_number = models.CharField(max_length=30, unique=True, blank=True)
    issued_at = models.DateTimeField(default=timezone.now)
    pdf_file = models.FileField(upload_to='receipts/', blank=True, null=True)

    class Meta:
        db_table = 'receipts'
        verbose_name = 'Reçu'
        verbose_name_plural = 'Reçus'
        ordering = ['-issued_at']

    def __str__(self):
        return self.receipt_number or f'Reçu #{self.pk}'

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = self._generate_receipt_number()
        super().save(*args, **kwargs)

    def _generate_receipt_number(self):
        year = timezone.now().year
        last = Receipt.objects.filter(
            receipt_number__startswith=f'REC-{year}-'
        ).order_by('-id').first()
        sequence = 1
        if last:
            try:
                sequence = int(last.receipt_number.rsplit('-', 1)[-1]) + 1
            except ValueError:
                pass
        return f'REC-{year}-{sequence:05d}'
