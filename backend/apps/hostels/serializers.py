from rest_framework import serializers
from .models import Hostel, Zone, RoomType, ComfortOption, Amenity, Room, Price


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ['id', 'hostel', 'name', 'floor']


class RoomTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomType
        fields = ['id', 'name', 'capacity']


class ComfortOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComfortOption
        fields = ['id', 'name']


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['id', 'name']


class PriceSerializer(serializers.ModelSerializer):
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    comfort_name = serializers.CharField(source='comfort.name', read_only=True)

    class Meta:
        model = Price
        fields = [
            'id', 'hostel', 'room_type', 'room_type_name', 'comfort', 'comfort_name',
            'monthly_rate', 'period_rate', 'electricity_fee', 'admin_fee', 'deposit',
            'free_cancellation', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoomListSerializer(serializers.ModelSerializer):
    """Version allégée pour les listes / le catalogue public."""

    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    comfort_name = serializers.CharField(source='comfort.name', read_only=True)
    capacity = serializers.IntegerField(read_only=True)
    beds_taken = serializers.IntegerField(read_only=True)
    beds_available = serializers.IntegerField(read_only=True)
    occupancy_status = serializers.CharField(read_only=True)
    monthly_rate = serializers.SerializerMethodField()
    deposit = serializers.SerializerMethodField()
    free_cancellation = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'hostel', 'hostel_name', 'zone', 'number', 'floor',
            'room_type', 'room_type_name', 'comfort', 'comfort_name',
            'capacity', 'beds_count', 'beds_taken', 'beds_available', 'occupancy_status',
            'electricity_policy', 'status', 'photos', 'monthly_rate',
            'deposit', 'free_cancellation',
        ]

    def get_monthly_rate(self, obj):
        price = obj.current_price
        return price.monthly_rate if price else None

    def get_deposit(self, obj):
        price = obj.current_price
        return price.deposit if price else None

    def get_free_cancellation(self, obj):
        price = obj.current_price
        return bool(price and price.free_cancellation)


class RoomDetailSerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    amenity_ids = serializers.PrimaryKeyRelatedField(
        source='amenities', queryset=Amenity.objects.all(), many=True, write_only=True, required=False
    )
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    room_type_detail = RoomTypeSerializer(source='room_type', read_only=True)
    comfort_detail = ComfortOptionSerializer(source='comfort', read_only=True)
    price = serializers.SerializerMethodField()
    beds_taken = serializers.IntegerField(read_only=True)
    beds_available = serializers.IntegerField(read_only=True)
    occupancy_status = serializers.CharField(read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'hostel', 'hostel_name', 'zone', 'number', 'floor',
            'room_type', 'room_type_detail', 'comfort', 'comfort_detail',
            'amenities', 'amenity_ids', 'beds_count', 'beds_taken', 'beds_available',
            'occupancy_status', 'electricity_policy', 'status',
            'photos', 'notes', 'price', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_price(self, obj):
        price = obj.current_price
        return PriceSerializer(price).data if price else None


class HostelListSerializer(serializers.ModelSerializer):
    total_rooms = serializers.IntegerField(read_only=True)
    available_rooms = serializers.IntegerField(read_only=True)

    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'slug', 'address', 'latitude', 'longitude', 'description', 'cover_image',
            'has_external_kitchen', 'is_active', 'total_rooms', 'available_rooms',
        ]


class HostelDetailSerializer(serializers.ModelSerializer):
    zones = ZoneSerializer(many=True, read_only=True)
    total_rooms = serializers.IntegerField(read_only=True)
    available_rooms = serializers.IntegerField(read_only=True)

    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'slug', 'address', 'latitude', 'longitude', 'phone_number', 'email',
            'description', 'cover_image', 'has_external_kitchen', 'is_active', 'zones',
            'total_rooms', 'available_rooms', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
