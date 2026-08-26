from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'notif_type', 'title', 'is_read', 'sent_successfully', 'created_at']
    list_filter = ['notif_type', 'channel', 'is_read', 'sent_successfully']
    search_fields = ['recipient__full_name', 'recipient__email', 'title']
