from django.contrib import admin
from .models import ExternalResidence


@admin.register(ExternalResidence)
class ExternalResidenceAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_name', 'phone_number', 'number_of_rooms', 'is_available', 'is_active']
    list_filter = ['is_available', 'is_active']
    search_fields = ['name', 'address']
