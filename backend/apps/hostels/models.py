from django.db import models
from django.core.validators import MinValueValidator


class Hostel(models.Model):
    """Une des résidences (Kamal, Muftah, Ossei, Dzorwulu, ...)."""

    name = models.CharField(max_length=150, unique=True, verbose_name='Nom')
    slug = models.SlugField(max_length=160, unique=True)
    address = models.CharField(max_length=255, blank=True, verbose_name='Adresse')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    phone_number = models.CharField(max_length=30, blank=True, verbose_name='Téléphone')
    email = models.EmailField(blank=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='hostels/covers/', blank=True, null=True)
    has_external_kitchen = models.BooleanField(
        default=False,
        verbose_name='Cuisine externe',
        help_text="Particularité de l'Hostel Dzorwulu.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hostels'
        verbose_name = 'Hostel'
        verbose_name_plural = 'Hostels'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def total_rooms(self):
        return self.rooms.count()

    @property
    def available_rooms(self):
        return self.rooms.filter(status=Room.Status.AVAILABLE).count()


class Zone(models.Model):
    """Regroupement interne à un hostel : zone (Kamal), bloc (Muftah), bâtiment...

    Générique pour ne pas figer un seul schéma d'organisation entre hostels.
    """

    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='zones')
    name = models.CharField(max_length=100, verbose_name='Nom de la zone/bloc')
    floor = models.CharField(max_length=30, blank=True, verbose_name='Étage')

    class Meta:
        db_table = 'hostel_zones'
        verbose_name = 'Zone / Bloc'
        verbose_name_plural = 'Zones / Blocs'
        unique_together = ('hostel', 'name')
        ordering = ['hostel', 'name']

    def __str__(self):
        return f'{self.hostel.name} – {self.name}'


class RoomType(models.Model):
    """Individuelle, Double, Triple, Quadruple — référentiel global paramétrable."""

    name = models.CharField(max_length=50, unique=True, verbose_name='Type de chambre')
    capacity = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Capacité (nombre de personnes)',
    )

    class Meta:
        db_table = 'room_types'
        verbose_name = 'Type de chambre'
        verbose_name_plural = 'Types de chambre'
        ordering = ['capacity']

    def __str__(self):
        return f'{self.name} ({self.capacity} pers.)'


class ComfortOption(models.Model):
    """Ventilée, Climatisée — référentiel global paramétrable."""

    name = models.CharField(max_length=50, unique=True, verbose_name='Niveau de confort')

    class Meta:
        db_table = 'comfort_options'
        verbose_name = 'Option de confort'
        verbose_name_plural = 'Options de confort'
        ordering = ['name']

    def __str__(self):
        return self.name


class Amenity(models.Model):
    """Équipement associable à une chambre (référentiel libre)."""

    name = models.CharField(max_length=80, unique=True, verbose_name='Équipement')

    class Meta:
        db_table = 'amenities'
        verbose_name = 'Équipement'
        verbose_name_plural = 'Équipements'
        ordering = ['name']

    def __str__(self):
        return self.name


class Room(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Disponible'
        RESERVED = 'reserved', 'Réservée'
        OCCUPIED = 'occupied', 'Occupée'
        PENDING = 'pending', 'En attente'
        MAINTENANCE = 'maintenance', 'En maintenance'
        OUT_OF_SERVICE = 'out_of_service', 'Hors service'
        BLOCKED = 'blocked', 'Bloquée temporairement'

    class ElectricityPolicy(models.TextChoices):
        INCLUDED = 'included', "Incluse dans le tarif"
        EXCLUDED = 'excluded', "Exclue du tarif"
        ADDITIONAL = 'additional', "Tarification complémentaire"

    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='rooms')
    zone = models.ForeignKey(
        Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='rooms'
    )
    number = models.CharField(max_length=20, verbose_name='Numéro de chambre')
    floor = models.CharField(max_length=30, blank=True, verbose_name='Étage')
    room_type = models.ForeignKey(RoomType, on_delete=models.PROTECT, related_name='rooms')
    comfort = models.ForeignKey(ComfortOption, on_delete=models.PROTECT, related_name='rooms')
    amenities = models.ManyToManyField(Amenity, blank=True, related_name='rooms')
    electricity_policy = models.CharField(
        max_length=20, choices=ElectricityPolicy.choices, default=ElectricityPolicy.INCLUDED
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    photos = models.JSONField(default=list, blank=True, help_text='Liste des URLs/chemins de photos.')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rooms'
        verbose_name = 'Chambre'
        verbose_name_plural = 'Chambres'
        unique_together = ('hostel', 'number')
        ordering = ['hostel', 'number']

    def __str__(self):
        return f'{self.hostel.name} – Chambre {self.number}'

    @property
    def capacity(self):
        return self.room_type.capacity

    @property
    def current_price(self):
        return Price.objects.filter(
            hostel=self.hostel, room_type=self.room_type, comfort=self.comfort
        ).first()


class Price(models.Model):
    """Grille tarifaire : Hostel -> Type de chambre -> Confort -> Tarif.

    Paramétrable entièrement par l'administrateur (section 8 du cahier des charges).
    """

    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='prices')
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='prices')
    comfort = models.ForeignKey(ComfortOption, on_delete=models.CASCADE, related_name='prices')

    monthly_rate = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Tarif mensuel')
    period_rate = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='Tarif par période'
    )
    electricity_fee = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Frais d'électricité"
    )
    admin_fee = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='Frais administratifs'
    )
    deposit = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='Caution'
    )
    free_cancellation = models.BooleanField(
        default=False,
        verbose_name='Annulation gratuite',
        help_text="À activer une fois la politique d'annulation confirmée (section 30 du cahier des charges).",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'prices'
        verbose_name = 'Tarif'
        verbose_name_plural = 'Tarifs'
        unique_together = ('hostel', 'room_type', 'comfort')
        ordering = ['hostel', 'room_type']

    def __str__(self):
        return f'{self.hostel.name} – {self.room_type.name} / {self.comfort.name} : {self.monthly_rate}'
