from django.contrib import admin
from .models import Hostel, Zone, RoomType, ComfortOption, Amenity, Room, Price


class ZoneInline(admin.TabularInline):
    model = Zone
    extra = 0


@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'has_external_kitchen', 'is_active', 'total_rooms']
    list_filter = ['is_active', 'has_external_kitchen']
    search_fields = ['name', 'address']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ZoneInline]


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'name', 'floor']
    list_filter = ['hostel']
    search_fields = ['name']


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'capacity']


@admin.register(ComfortOption)
class ComfortOptionAdmin(admin.ModelAdmin):
    list_display = ['name']


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ['name']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'number', 'zone', 'room_type', 'comfort', 'beds_count', 'status', 'electricity_policy']
    list_filter = ['hostel', 'room_type', 'comfort', 'status', 'electricity_policy']
    search_fields = ['number']
    autocomplete_fields = ['hostel', 'zone']
    filter_horizontal = ['amenities']


@admin.register(Price)
class PriceAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'room_type', 'comfort', 'monthly_rate', 'free_cancellation', 'is_active']
    list_filter = ['hostel', 'room_type', 'comfort', 'free_cancellation', 'is_active']
