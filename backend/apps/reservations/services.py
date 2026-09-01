import json

from django.core import serializers
from django.db import transaction
from django.utils import timezone

from apps.hostels.models import Room
from .models import Reservation, ReservationMember, Student


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


def _dump(queryset):
    return json.loads(serializers.serialize('json', queryset))


def build_tenants_reset_backup():
    """Sérialise en JSON tout ce que reset_tenants_data() s'apprête à supprimer
    (réservations, factures/paiements/reçus, étudiants et leurs comptes de
    connexion), pour permettre une restauration manuelle en cas d'erreur."""
    from apps.authentication.models import User
    from apps.billing.models import Invoice, Payment, Receipt

    return {
        'generated_at': timezone.now().isoformat(),
        'reservations': _dump(Reservation.objects.all()),
        'reservation_members': _dump(ReservationMember.objects.all()),
        'invoices': _dump(Invoice.objects.all()),
        'payments': _dump(Payment.objects.all()),
        'receipts': _dump(Receipt.objects.all()),
        'students': _dump(Student.objects.all()),
        'student_users': _dump(User.objects.filter(role=User.Role.STUDENT)),
    }


@transaction.atomic
def reset_tenants_data():
    """Supprime toutes les réservations (avec leurs factures/paiements/reçus en
    cascade) ainsi que les étudiants et leurs comptes de connexion, puis remet
    à 'Disponible' les chambres qui n'ont plus de réservation derrière elles.

    Ne touche ni aux hostels/chambres/tarifs/référentiels, ni aux comptes non-
    étudiants (admin, gestionnaire, comptable, agent d'accueil).
    """
    from apps.authentication.models import User

    reservations_count = Reservation.objects.count()
    students_count = Student.objects.count()

    Reservation.objects.all().delete()  # cascade : Invoice, Payment, Receipt, ReservationMember
    User.objects.filter(role=User.Role.STUDENT).delete()  # cascade : Student, Notification

    rooms_reset = Room.objects.filter(
        status__in=[Room.Status.RESERVED, Room.Status.OCCUPIED, Room.Status.PENDING]
    ).update(status=Room.Status.AVAILABLE)

    return {
        'reservations_supprimees': reservations_count,
        'etudiants_supprimes': students_count,
        'chambres_reinitialisees': rooms_reset,
    }
