from django.db import models
from django.conf import settings
from apps.committees.models import Committee


class Collection(models.Model):
    """Collection model for tracking money received"""
    
    CHANNEL_CHOICES = [
        ('CASH', 'Cash'),
        ('MPESA', 'M-Pesa'),
        ('BANK', 'Bank Transfer'),
        ('OTHER', 'Other'),
    ]
    
    committee = models.ForeignKey(
        Committee,
        on_delete=models.CASCADE,
        related_name='collections'
    )
    payer_name = models.CharField(max_length=255)
    payer_phone = models.CharField(max_length=15, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='CASH')
    reference_number = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_collections'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'collections'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.payer_name} - {self.amount} - {self.committee.name}"


class Expense(models.Model):
    """Expense model for tracking money spent"""
    
    CATEGORY_CHOICES = [
        ('TRANSPORT', 'Transport'),
        ('FOOD', 'Food & Catering'),
        ('VENUE', 'Venue'),
        ('EQUIPMENT', 'Equipment'),
        ('SERVICE', 'Service Provider'),
        ('MATERIALS', 'Materials'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PAID', 'Paid'),
    ]
    
    committee = models.ForeignKey(
        Committee,
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    vendor = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    receipt_url = models.FileField(upload_to='receipts/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='requested_expenses'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'expenses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.vendor} - {self.amount} - {self.committee.name}"
