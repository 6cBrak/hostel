from django.contrib import admin
from django.shortcuts import redirect
from .models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Identité', {'fields': ('site_name', 'tagline', 'logo', 'favicon')}),
        ('Contact', {'fields': ('contact_email', 'contact_phone', 'address')}),
        ('Réseaux sociaux', {'fields': ('facebook_url', 'instagram_url', 'whatsapp_number')}),
        ('Pied de page', {'fields': ('footer_text',)}),
    )
    readonly_fields = ['updated_at']

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        settings = SiteSettings.load()
        return redirect('admin:sitesettings_sitesettings_change', settings.pk)
