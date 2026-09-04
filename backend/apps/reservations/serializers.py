from django.utils import timezone
from rest_framework import serializers
from apps.authentication.serializers import UserSerializer
from apps.hostels.models import Hostel, Room
from apps.hostels.serializers import RoomListSerializer
from apps.external_residences.models import ExternalResidence
from .models import Student, Reservation, ReservationMember, CheckIn, CheckOut, add_months


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'sex', 'date_of_birth', 'nationality', 'student_number',
            'program', 'academic_year', 'emergency_contact_name', 'emergency_contact_phone',
            'documents', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class StudentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'sex', 'date_of_birth', 'nationality', 'student_number',
            'program', 'academic_year', 'emergency_contact_name',
            'emergency_contact_phone', 'documents',
        ]


class ReservationMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservationMember
        fields = [
            'id', 'full_name', 'sex', 'date_of_birth', 'nationality',
            'phone_number', 'email', 'student_number', 'program',
        ]


class ReservationListSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.user.full_name', read_only=True)
    requester_phone = serializers.CharField(source='requester.user.phone_number', read_only=True)
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_number', 'requester_name', 'requester_phone',
            'hostel', 'hostel_name', 'room', 'room_number',
            'is_group', 'number_of_people', 'beds_reserved', 'desired_start_date', 'duration_months',
            'desired_end_date', 'days_remaining', 'status', 'created_at',
        ]

    def get_days_remaining(self, obj):
        if not obj.desired_end_date:
            return None
        return (obj.desired_end_date - timezone.localdate()).days


class ReservationDetailSerializer(serializers.ModelSerializer):
    requester = StudentSerializer(read_only=True)
    members = ReservationMemberSerializer(many=True, read_only=True)
    room_detail = RoomListSerializer(source='room', read_only=True)
    alternative_room_detail = RoomListSerializer(source='alternative_room', read_only=True)
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    alternative_hostel_name = serializers.CharField(source='alternative_hostel.name', read_only=True)
    days_remaining = serializers.SerializerMethodField()
    check_out = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_number', 'requester', 'hostel', 'hostel_name',
            'requested_room_type', 'requested_comfort', 'room', 'room_detail',
            'is_group', 'number_of_people', 'beds_reserved', 'members',
            'desired_start_date', 'duration_months', 'desired_end_date', 'days_remaining',
            'status', 'rejection_reason', 'check_out',
            'alternative_hostel', 'alternative_hostel_name', 'alternative_room',
            'alternative_room_detail', 'alternative_external_residence', 'alternative_note',
            'handled_by', 'decided_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'reservation_number', 'status', 'rejection_reason',
            'alternative_hostel', 'alternative_room', 'alternative_external_residence',
            'alternative_note', 'handled_by', 'decided_at', 'created_at', 'updated_at',
        ]

    def get_days_remaining(self, obj):
        if not obj.desired_end_date:
            return None
        return (obj.desired_end_date - timezone.localdate()).days

    def get_check_out(self, obj):
        if not hasattr(obj, 'check_out'):
            return None
        return CheckOutSerializer(obj.check_out).data


class ReservationCreateSerializer(serializers.ModelSerializer):
    members = ReservationMemberSerializer(many=True, required=False)
    duration_months = serializers.IntegerField(min_value=1, max_value=36)
    beds_reserved = serializers.IntegerField(min_value=1, default=1)

    class Meta:
        model = Reservation
        fields = [
            'hostel', 'requested_room_type', 'requested_comfort', 'room',
            'is_group', 'number_of_people', 'beds_reserved', 'desired_start_date', 'duration_months',
            'members',
        ]

    def validate(self, data):
        room = data.get('room')
        beds_reserved = data.get('beds_reserved', 1)
        if room and beds_reserved > room.beds_available:
            raise serializers.ValidationError(
                {'beds_reserved': f"Seulement {room.beds_available} lit(s) disponible(s) dans cette chambre."}
            )
        return data

    def create(self, validated_data):
        members_data = validated_data.pop('members', [])
        student, _ = Student.objects.get_or_create(user=self.context['request'].user)
        validated_data['desired_end_date'] = add_months(
            validated_data['desired_start_date'], validated_data['duration_months']
        )
        reservation = Reservation.objects.create(requester=student, **validated_data)
        for member_data in members_data:
            ReservationMember.objects.create(reservation=reservation, **member_data)
        return reservation


class RejectReservationSerializer(serializers.Serializer):
    reason = serializers.CharField()


class ProposeAlternativeSerializer(serializers.Serializer):
    alternative_hostel = serializers.PrimaryKeyRelatedField(
        queryset=Hostel.objects.all(), required=False, allow_null=True,
    )
    alternative_room = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(), required=False, allow_null=True,
    )
    alternative_external_residence = serializers.PrimaryKeyRelatedField(
        queryset=ExternalResidence.objects.all(), required=False, allow_null=True,
    )
    note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if not any([
            data.get('alternative_room'),
            data.get('alternative_hostel'),
            data.get('alternative_external_residence'),
        ]):
            raise serializers.ValidationError(
                "Précisez au moins une alternative (chambre, hostel ou résidence externe)."
            )
        return data


class AlternativeResponseSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=['accept', 'refuse', 'request_other'])


class CheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = [
            'id', 'reservation', 'checked_in_at', 'identity_validated',
            'key_handed_over', 'room_initial_state', 'performed_by',
        ]
        read_only_fields = ['id', 'performed_by']


class CheckOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckOut
        fields = [
            'id', 'reservation', 'checked_out_at', 'room_verified',
            'damages_notes', 'additional_fees', 'balance_due', 'closed', 'performed_by',
        ]
        # balance_due est calculé côté serveur (solde de facture + frais additionnels),
        # closed est toujours forcé à True à la création — voir CheckOutViewSet.perform_create.
        read_only_fields = ['id', 'balance_due', 'closed', 'performed_by']

    def validate_reservation(self, value):
        if value.status not in (Reservation.Status.ACCEPTED, Reservation.Status.CONFIRMED):
            raise serializers.ValidationError(
                "Cette réservation n'est pas un séjour actif (déjà clôturé, rejeté ou annulé)."
            )
        return value
