from django.contrib import admin
from .models import Collection, Expense


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ['payer_name', 'amount', 'channel', 'committee', 'recorded_by', 'created_at']
    list_filter = ['channel', 'created_at']
    search_fields = ['payer_name', 'payer_phone', 'reference_number']
    ordering = ['-created_at']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'amount', 'category', 'status', 'committee', 
                    'requested_by', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['vendor', 'description']
    ordering = ['-created_at']
