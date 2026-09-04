import json

from django.core import serializers
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from .models import Reservation, ReservationMember, Student, add_months


def other_beds_taken(room, reservation):
    """Lits déjà engagés sur cette chambre par d'AUTRES réservations actives
    (accepted/confirmed) — sert à valider une affectation sans compter deux
    fois la réservation qu'on est en train de traiter. Utilisé par accept(),
    respond_alternative() et transfer_reservation()."""
    return room.reservations.filter(
        status__in=[Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED]
    ).exclude(pk=reservation.pk).aggregate(total=Sum('beds_reserved'))['total'] or 0


@transaction.atomic
def transfer_reservation(reservation, new_room, beds_reserved, remaining_months, performed_by=None):
    """Transfère un locataire vers une nouvelle chambre (éventuellement un
    autre hostel).

    - Clôture l'ancienne réservation (statut 'Transférée') — son lit se
      libère automatiquement, l'occupation étant dérivée du statut.
    - Crée une nouvelle réservation pour la nouvelle chambre, sur la durée
      restante indiquée, avec sa propre facture générée au tarif courant.
    - L'ancienne facture n'est JAMAIS modifiée : ce qui a été facturé/payé
      pour le temps passé dans l'ancienne chambre reste tel quel.
    - Garde un lien (previous_reservation) entre les deux pour l'historique.

    Lève ValueError si la réservation n'est pas un séjour actif, ou si la
    chambre de destination n'a pas assez de lits libres.
    """
    if reservation.status not in (Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED):
        raise ValueError("Cette réservation n'est pas un séjour actif.")

    if new_room.status != new_room.Status.AVAILABLE:
        raise ValueError(f"Chambre indisponible ({new_room.get_status_display()}).")

    already_taken = other_beds_taken(new_room, reservation)
    if already_taken + beds_reserved > new_room.beds_count:
        remaining = max(new_room.beds_count - already_taken, 0)
        raise ValueError(f"Plus que {remaining} lit(s) disponible(s) dans cette chambre.")

    reservation.status = Reservation.Status.TRANSFERRED
    reservation.save(update_fields=['status'])

    start_date = timezone.localdate()
    new_reservation = Reservation.objects.create(
        requester=reservation.requester,
        hostel=new_room.hostel,
        room=new_room,
        beds_reserved=beds_reserved,
        desired_start_date=start_date,
        duration_months=remaining_months,
        desired_end_date=add_months(start_date, remaining_months),
        status=Reservation.Status.ACCEPTED,
        handled_by=performed_by,
        decided_at=timezone.now(),
        previous_reservation=reservation,
    )

    from apps.billing.services import generate_proforma_invoice
    invoice = generate_proforma_invoice(new_reservation)
    return new_reservation, invoice


def sync_room_occupancy_for_reservation(reservation):
    """Confirme une réservation (ACCEPTED -> CONFIRMED) dès que :
    - au moins un paiement (partiel ou intégral) a été enregistré sur sa facture, ET
    - la date d'arrivée souhaitée (desired_start_date) est atteinte.

    L'occupation de la chambre n'est plus un champ à mettre à jour ici : elle
    est calculée à la volée depuis les réservations ACCEPTED/CONFIRMED
    (voir Room.beds_taken). Retourne True si un changement a eu lieu.
    """
    if reservation.status != Reservation.Status.ACCEPTED:
        return False
    if not reservation.room:
        return False
    if not reservation.desired_start_date or reservation.desired_start_date > timezone.localdate():
        return False
    if not hasattr(reservation, 'invoice') or not reservation.invoice.payments.exists():
        return False

    reservation.status = Reservation.Status.CONFIRMED
    reservation.save(update_fields=['status'])
    return True


def sync_all_pending_room_occupancy():
    """Applique sync_room_occupancy_for_reservation à toutes les réservations
    candidates (acceptées, chambre assignée, date d'arrivée atteinte, au moins
    un paiement).

    Destiné à être appelé régulièrement (tâche planifiée) pour couvrir le cas
    où la date d'arrivée est atteinte sans qu'aucune action ne déclenche la
    vérification (paiement déjà enregistré avant l'arrivée). Retourne le
    nombre de réservations confirmées.
    """
    candidates = Reservation.objects.select_related('room').filter(
        status=Reservation.Status.ACCEPTED,
        room__isnull=False,
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
    cascade) ainsi que les étudiants et leurs comptes de connexion.

    L'occupation des chambres se recalcule automatiquement (elle est dérivée
    des réservations actives) : aucune remise à zéro manuelle n'est nécessaire.
    Ne touche ni aux hostels/chambres/tarifs/référentiels (les états
    maintenance/hors service/bloquée sont administratifs, indépendants des
    locataires), ni aux comptes non-étudiants (admin, gestionnaire, comptable,
    agent d'accueil).
    """
    from apps.authentication.models import User

    reservations_count = Reservation.objects.count()
    students_count = Student.objects.count()

    Reservation.objects.all().delete()  # cascade : Invoice, Payment, Receipt, ReservationMember
    User.objects.filter(role=User.Role.STUDENT).delete()  # cascade : Student, Notification

    return {
        'reservations_supprimees': reservations_count,
        'etudiants_supprimes': students_count,
    }
