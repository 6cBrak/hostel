from rest_framework import serializers
from .models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            'site_name', 'tagline', 'logo', 'favicon', 'contact_email', 'contact_phone',
            'address', 'facebook_url', 'instagram_url', 'whatsapp_number', 'footer_text',
            'updated_at',
        ]
        read_only_fields = ['updated_at']
