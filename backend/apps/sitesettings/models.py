from django.db import models


class SiteSettings(models.Model):
    """Paramètres globaux du site — instance unique, modifiable depuis l'admin
    (logo, coordonnées, réseaux sociaux...) sans intervention du développeur."""

    site_name = models.CharField(max_length=150, default='SMART HOSTEL ATOMA')
    tagline = models.CharField(max_length=200, blank=True, verbose_name='Slogan')
    logo = models.ImageField(upload_to='site/', blank=True, null=True)
    favicon = models.ImageField(upload_to='site/', blank=True, null=True)

    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)

    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    whatsapp_number = models.CharField(max_length=30, blank=True)

    footer_text = models.CharField(max_length=255, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'site_settings'
        verbose_name = 'Paramètres du site'
        verbose_name_plural = 'Paramètres du site'

    def __str__(self):
        return self.site_name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
