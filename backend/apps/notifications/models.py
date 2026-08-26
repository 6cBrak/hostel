from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        ACCOUNT_CREATED = 'account_created', 'Création de compte'
        RESERVATION_REQUEST_RECEIVED = 'reservation_request_received', 'Demande de réservation reçue'
        RESERVATION_PENDING = 'reservation_pending', 'Réservation en attente'
        RESERVATION_ACCEPTED = 'reservation_accepted', 'Réservation acceptée'
        RESERVATION_REJECTED = 'reservation_rejected', 'Réservation rejetée'
        ALTERNATIVE_PROPOSED = 'alternative_proposed', "Proposition d'une chambre alternative"
        INVOICE_GENERATED = 'invoice_generated', 'Génération de facture pro-forma'
        PAYMENT_CONFIRMED = 'payment_confirmed', 'Confirmation de paiement'
        PAYMENT_REMINDER = 'payment_reminder', 'Rappel de paiement'
        BALANCE_REMAINING = 'balance_remaining', 'Solde restant'
        RESERVATION_CONFIRMED = 'reservation_confirmed', 'Confirmation définitive de réservation'
        RESERVATION_CANCELLED = 'reservation_cancelled', 'Annulation'
        RESERVATION_EXPIRED = 'reservation_expired', "Expiration d'une réservation"

    class Channel(models.TextChoices):
        EMAIL = 'email', 'E-mail'
        SMS = 'sms', 'SMS'
        WHATSAPP = 'whatsapp', 'WhatsApp'
        PUSH = 'push', 'Notification push'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    notif_type = models.CharField(max_length=40, choices=Type.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    reservation = models.ForeignKey(
        'reservations.Reservation', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications'
    )
    channel = models.CharField(max_length=15, choices=Channel.choices, default=Channel.EMAIL)
    is_read = models.BooleanField(default=False)
    sent_successfully = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_notif_type_display()} → {self.recipient}'
