from django.contrib import admin
from .models import Student, Reservation, ReservationMember, CheckIn, CheckOut


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['user', 'student_number', 'program', 'academic_year']
    search_fields = ['user__full_name', 'user__email', 'student_number']


class ReservationMemberInline(admin.TabularInline):
    model = ReservationMember
    extra = 0


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = [
        'reservation_number', 'requester', 'hostel', 'room', 'beds_reserved',
        'status', 'desired_start_date', 'created_at',
    ]
    list_filter = ['status', 'hostel', 'is_group']
    search_fields = ['reservation_number', 'requester__user__full_name']
    inlines = [ReservationMemberInline]
    readonly_fields = ['reservation_number', 'created_at', 'updated_at']


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'checked_in_at', 'identity_validated', 'key_handed_over']


@admin.register(CheckOut)
class CheckOutAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'checked_out_at', 'balance_due', 'closed']
