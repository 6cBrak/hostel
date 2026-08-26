from rest_framework import serializers
from .models import ExternalResidence


class ExternalResidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalResidence
        fields = [
            'id', 'name', 'address', 'contact_name', 'phone_number', 'email',
            'number_of_rooms', 'characteristics', 'tariffs_notes', 'conditions',
            'is_available', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
