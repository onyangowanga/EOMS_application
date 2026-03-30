from django.db import models
from django.conf import settings
from apps.committees.models import Committee


class Collection(models.Model):
    """Collection model for tracking money received - now event-centric"""
    
    CHANNEL_CHOICES = [
        ('CASH', 'Cash'),
        ('MPESA', 'M-Pesa'),
        ('BANK', 'Bank Transfer'),
        ('OTHER', 'Other'),
    ]
    
    SOURCE_TYPE_CHOICES = [
        ('CLUSTER', 'Cluster Group'),
        ('GENERAL', 'General/Direct'),
    ]
    
    # NEW: Event-centric architecture
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='collections',
        null=True,
        blank=True,
        help_text="Main event this collection belongs to"
    )
    
    # NEW: Cluster integration
    cluster = models.ForeignKey(
        'events.ClusterGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='collections',
        help_text="Cluster group if collection is from fundraising cluster"
    )
    
    # NEW: Source type classification
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPE_CHOICES,
        default='GENERAL',
        help_text="Whether from cluster fundraising or general donation"
    )
    
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
    """Expense model for tracking money spent - now event-centric with budget integration"""
    
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
        ('APPROVED_CHAIR', 'Approved by Chair'),
        ('APPROVED_TREASURER', 'Approved by Treasurer'),
        ('APPROVED_FINANCE', 'Approved by Finance Member'),
        ('FULLY_APPROVED', 'Fully Approved'),
        ('PAID', 'Paid'),
        ('REJECTED', 'Rejected'),
    ]
    
    # NEW: Event-centric architecture
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='expenses',
        null=True,
        blank=True,
        help_text="Main event this expense belongs to"
    )
    
    # NEW: Budget integration
    budget_item = models.ForeignKey(
        'events.BudgetItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses',
        help_text="Budget item this expense is charged against"
    )
    
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
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    
    # Requester
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='requested_expenses'
    )
    
    # NEW: Three-tier approval system
    approved_by_chair = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses_approved_as_chair',
        help_text="Chairman approval"
    )
    approved_by_treasurer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses_approved_as_treasurer',
        help_text="Treasurer approval"
    )
    approved_by_finance = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses_approved_as_finance',
        help_text="Finance committee member approval"
    )
    
    # DEPRECATED: Keeping for backward compatibility
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # NEW: Payment tracking
    paid_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the payment was made"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'expenses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.vendor} - {self.amount} - {self.committee.name}"
