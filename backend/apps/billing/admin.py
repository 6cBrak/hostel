from django.contrib import admin
from .models import Invoice, Payment, Receipt


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'reservation', 'total_amount', 'status', 'issued_at']
    list_filter = ['status']
    search_fields = ['invoice_number', 'reservation__reservation_number']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']
    inlines = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'date', 'amount', 'payment_type', 'payment_method', 'recorded_by']
    list_filter = ['payment_type', 'payment_method']
    search_fields = ['invoice__invoice_number', 'reference']


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['receipt_number', 'payment', 'issued_at']
    readonly_fields = ['receipt_number']
