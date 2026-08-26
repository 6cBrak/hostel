from django.db import models


class ExternalResidence(models.Model):
    """Résidence partenaire externe, utilisée comme solution alternative
    lorsqu'aucune chambre interne n'est disponible (section 20)."""

    name = models.CharField(max_length=150, verbose_name='Nom')
    address = models.CharField(max_length=255, blank=True, verbose_name='Adresse')
    contact_name = models.CharField(max_length=150, blank=True, verbose_name='Personne responsable')
    phone_number = models.CharField(max_length=30, blank=True, verbose_name='Téléphone')
    email = models.EmailField(blank=True)
    number_of_rooms = models.PositiveIntegerField(default=0, verbose_name='Nombre de chambres')
    characteristics = models.TextField(blank=True, verbose_name='Caractéristiques')
    tariffs_notes = models.TextField(blank=True, verbose_name='Tarifs (notes libres)')
    conditions = models.TextField(blank=True, verbose_name='Conditions')
    is_available = models.BooleanField(default=True, verbose_name='Disponible')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'external_residences'
        verbose_name = 'Résidence externe'
        verbose_name_plural = 'Résidences externes'
        ordering = ['name']

    def __str__(self):
        return self.name
