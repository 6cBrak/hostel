from calendar import monthrange

from django.conf import settings
from django.db import models
from django.utils import timezone


def add_months(source_date, months):
    """Ajoute un nombre de mois à une date, en bornant le jour à la fin du mois cible
    (ex: 31 janvier + 1 mois -> 28/29 février)."""
    month_index = source_date.month - 1 + months
    year = source_date.year + month_index // 12
    month = month_index % 12 + 1
    day = min(source_date.day, monthrange(year, month)[1])
    return source_date.replace(year=year, month=month, day=day)


class Student(models.Model):
    """Profil académique/personnel complémentaire, lié à un compte utilisateur (rôle student)."""

    class Sex(models.TextChoices):
        MALE = 'M', 'Masculin'
        FEMALE = 'F', 'Féminin'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile'
    )
    sex = models.CharField(max_length=1, choices=Sex.choices, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=80, blank=True)
    student_number = models.CharField(max_length=50, blank=True, verbose_name='Numéro étudiant / matricule')
    program = models.CharField(max_length=150, blank=True, verbose_name='Programme / formation')
    academic_year = models.CharField(max_length=20, blank=True, verbose_name='Année académique')
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)
    documents = models.JSONField(default=list, blank=True, help_text='Documents justificatifs (chemins/URLs).')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        verbose_name = 'Étudiant'
        verbose_name_plural = 'Étudiants'

    def __str__(self):
        return self.user.full_name


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'En attente de validation'
        ACCEPTED = 'accepted', 'Acceptée'
        REJECTED = 'rejected', 'Rejetée'
        ALTERNATIVE_PROPOSED = 'alternative_proposed', 'Alternative proposée'
        ALTERNATIVE_REJECTED = 'alternative_rejected', "Alternative refusée par l'étudiant"
        CONFIRMED = 'confirmed', 'Confirmée définitivement'
        CANCELLED = 'cancelled', 'Annulée'
        EXPIRED = 'expired', 'Expirée'

    reservation_number = models.CharField(max_length=30, unique=True, blank=True)

    requester = models.ForeignKey(
        Student, on_delete=models.PROTECT, related_name='reservations',
        verbose_name='Étudiant demandeur / responsable du groupe',
    )

    hostel = models.ForeignKey('hostels.Hostel', on_delete=models.PROTECT, related_name='reservations')
    requested_room_type = models.ForeignKey(
        'hostels.RoomType', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    requested_comfort = models.ForeignKey(
        'hostels.ComfortOption', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    room = models.ForeignKey(
        'hostels.Room', on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations',
        verbose_name='Chambre affectée',
    )

    is_group = models.BooleanField(default=False)
    number_of_people = models.PositiveSmallIntegerField(default=1)

    desired_start_date = models.DateField()
    duration_months = models.PositiveSmallIntegerField(
        null=True, blank=True, verbose_name='Durée souhaitée (en mois)'
    )
    desired_end_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=25, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True)

    alternative_hostel = models.ForeignKey(
        'hostels.Hostel', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    alternative_room = models.ForeignKey(
        'hostels.Room', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    alternative_external_residence = models.ForeignKey(
        'external_residences.ExternalResidence', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    alternative_note = models.TextField(blank=True)

    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+',
        help_text="Administrateur ayant traité la demande.",
    )
    decided_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reservations'
        verbose_name = 'Réservation'
        verbose_name_plural = 'Réservations'
        ordering = ['-created_at']

    def __str__(self):
        return self.reservation_number or f'Réservation #{self.pk}'

    def save(self, *args, **kwargs):
        if not self.reservation_number:
            self.reservation_number = self._generate_reservation_number()
        super().save(*args, **kwargs)

    def _generate_reservation_number(self):
        year = timezone.now().year
        last = Reservation.objects.filter(
            reservation_number__startswith=f'RES-{year}-'
        ).order_by('-id').first()
        sequence = 1
        if last:
            try:
                sequence = int(last.reservation_number.rsplit('-', 1)[-1]) + 1
            except ValueError:
                pass
        return f'RES-{year}-{sequence:05d}'


class ReservationMember(models.Model):
    """Membre additionnel d'une réservation de groupe (hors responsable)."""

    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='members')
    full_name = models.CharField(max_length=150)
    sex = models.CharField(max_length=1, choices=Student.Sex.choices, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=80, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    student_number = models.CharField(max_length=50, blank=True)
    program = models.CharField(max_length=150, blank=True)

    class Meta:
        db_table = 'reservation_members'
        verbose_name = 'Membre de réservation'
        verbose_name_plural = 'Membres de réservation'

    def __str__(self):
        return f'{self.full_name} ({self.reservation.reservation_number})'


class CheckIn(models.Model):
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='check_in')
    checked_in_at = models.DateTimeField(default=timezone.now)
    identity_validated = models.BooleanField(default=False)
    key_handed_over = models.BooleanField(default=False)
    room_initial_state = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )

    class Meta:
        db_table = 'check_ins'
        verbose_name = 'Check-in'
        verbose_name_plural = 'Check-ins'

    def __str__(self):
        return f'Check-in {self.reservation.reservation_number}'


class CheckOut(models.Model):
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='check_out')
    checked_out_at = models.DateTimeField(default=timezone.now)
    room_verified = models.BooleanField(default=False)
    damages_notes = models.TextField(blank=True)
    additional_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    closed = models.BooleanField(default=False)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )

    class Meta:
        db_table = 'check_outs'
        verbose_name = 'Check-out'
        verbose_name_plural = 'Check-outs'

    def __str__(self):
        return f'Check-out {self.reservation.reservation_number}'
