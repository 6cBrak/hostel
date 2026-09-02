from django.contrib import admin
from .models import CashBox, CashMovement, Expense, ExpenseCategory


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'category', 'amount', 'date', 'recorded_by']
    list_filter = ['hostel', 'category']
    search_fields = ['description']
    readonly_fields = ['recorded_by', 'created_at', 'updated_at']


@admin.register(CashMovement)
class CashMovementAdmin(admin.ModelAdmin):
    list_display = ['movement_type', 'amount', 'date', 'hostel', 'recorded_by', 'created_at']
    list_filter = ['movement_type', 'hostel']
    search_fields = ['description']
    readonly_fields = ['payment', 'expense', 'recorded_by', 'created_at']


@admin.register(CashBox)
class CashBoxAdmin(admin.ModelAdmin):
    list_display = ['balance', 'updated_at']
    readonly_fields = ['balance', 'updated_at']

    def has_add_permission(self, request):
        return not CashBox.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
