import logging

from django.conf import settings
from django.core.mail import send_mail

from .models import Notification

logger = logging.getLogger(__name__)


def notify(recipient, notif_type, title, message, reservation=None):
    """Crée la notification en base et tente l'envoi e-mail (section 15)."""

    notification = Notification.objects.create(
        recipient=recipient,
        notif_type=notif_type,
        title=title,
        message=message,
        reservation=reservation,
    )

    if not recipient.email:
        return notification

    try:
        send_mail(
            subject=title,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            fail_silently=False,
        )
        notification.sent_successfully = True
        notification.save(update_fields=['sent_successfully'])
    except Exception:
        logger.exception('Échec de l\'envoi de la notification %s à %s', notif_type, recipient.email)

    return notification
