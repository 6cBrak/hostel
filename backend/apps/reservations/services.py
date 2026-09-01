from django.utils import timezone

from apps.hostels.models import Room
from .models import Reservation


def sync_room_occupancy_for_reservation(reservation):
    """Bascule la chambre d'une réservation en 'Occupée' dès que :
    - au moins un paiement (partiel ou intégral) a été enregistré sur sa facture, ET
    - la date d'arrivée souhaitée (desired_start_date) est atteinte.

    Ne touche pas aux chambres déjà occupées ou dans un état particulier
    (maintenance, hors service, bloquée). Retourne True si un changement a eu lieu.
    """
    room = reservation.room
    if not room or room.status != Room.Status.RESERVED:
        return False
    if reservation.status not in (Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED):
        return False
    if not reservation.desired_start_date or reservation.desired_start_date > timezone.localdate():
        return False
    if not hasattr(reservation, 'invoice') or not reservation.invoice.payments.exists():
        return False

    room.status = Room.Status.OCCUPIED
    room.save(update_fields=['status'])

    if reservation.status != Reservation.Status.CONFIRMED:
        reservation.status = Reservation.Status.CONFIRMED
        reservation.save(update_fields=['status'])

    return True


def sync_all_pending_room_occupancy():
    """Applique sync_room_occupancy_for_reservation à toutes les réservations
    candidates (chambre réservée, date d'arrivée atteinte, au moins un paiement).

    Destiné à être appelé régulièrement (tâche planifiée) pour couvrir le cas
    où la date d'arrivée est atteinte sans qu'aucune action ne déclenche la
    vérification (paiement déjà enregistré avant l'arrivée). Retourne le
    nombre de chambres basculées en 'Occupée'.
    """
    candidates = Reservation.objects.select_related('room').filter(
        status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED],
        room__isnull=False,
        room__status=Room.Status.RESERVED,
        desired_start_date__lte=timezone.localdate(),
        invoice__payments__isnull=False,
    ).distinct()

    return sum(1 for reservation in candidates if sync_room_occupancy_for_reservation(reservation))
