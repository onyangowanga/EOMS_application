from django.db import models
from django.conf import settings
from apps.committees.models import Committee


class ServiceProvider(models.Model):
    """ServiceProvider model for managing service providers"""
    
    TYPE_CHOICES = [
        ('MORTUARY', 'Mortuary'),
        ('TRANSPORT', 'Transport'),
        ('CATERING', 'Catering'),
        ('VENUE', 'Venue'),
        ('EQUIPMENT', 'Equipment Rental'),
        ('PRINTING', 'Printing'),
        ('MUSIC', 'Music/Entertainment'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('QUOTED', 'Quote Received'),
        ('BOOKED', 'Booked'),
        ('CONFIRMED', 'Confirmed'),
        ('PAID', 'Paid'),
        ('COMPLETED', 'Service Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    committee = models.ForeignKey(
        Committee,
        on_delete=models.CASCADE,
        related_name='providers'
    )
    name = models.CharField(max_length=255)
    provider_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    contact_person = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    cost_estimate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='QUOTED')
    notes = models.TextField(blank=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='added_providers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'service_providers'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.provider_type}"
