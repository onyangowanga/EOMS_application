from django.contrib import admin
from .models import ServiceProvider


@admin.register(ServiceProvider)
class ServiceProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider_type', 'committee', 'phone', 'cost_estimate', 
                    'status', 'created_at']
    list_filter = ['provider_type', 'status', 'created_at']
    search_fields = ['name', 'contact_person', 'phone']
    ordering = ['-created_at']
