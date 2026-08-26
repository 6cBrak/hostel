from django.apps import AppConfig


class SiteSettingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sitesettings'
    label = 'sitesettings'
    verbose_name = 'Paramètres du site'
