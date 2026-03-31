from django.db import models
from django.conf import settings
from decimal import Decimal


class Committee(models.Model):
    """Committee/Subcommittee model - now event-centric"""
    
    COMMITTEE_TYPE_CHOICES = [
        ('MAIN', 'Main Committee'),
        ('BUDGET_FINANCE', 'Budget & Finance Committee'),
        ('FUNDS_MOBILIZATION', 'Funds Mobilization Committee'),
        ('LOGISTICS', 'Logistics'),
        ('CATERING', 'Catering'),
        ('VENUE', 'Venue'),
        ('TRANSPORT', 'Transport'),
        ('MEDIA', 'Media & Communications'),
        ('SECURITY', 'Security'),
        ('OTHER', 'Other'),
    ]
    
    # NEW: Event-centric architecture
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='subcommittees',
        null=True,
        blank=True,
        help_text="Main event this committee belongs to"
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # NEW: Committee classification
    is_main = models.BooleanField(
        default=False,
        help_text="Whether this is the main/umbrella committee"
    )
    committee_type = models.CharField(
        max_length=30,
        choices=COMMITTEE_TYPE_CHOICES,
        default='OTHER',
        help_text="Type/function of this committee"
    )
    
    # NEW: Committee lead
    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_committees',
        help_text="Lead/chairperson of this committee"
    )
    
    # NEW: Activity planning
    expected_activities = models.TextField(
        blank=True,
        help_text="Expected activities and responsibilities"
    )
    deadline = models.DateField(
        null=True,
        blank=True,
        help_text="Deadline for committee deliverables"
    )
    
    # NEW: Budget allocation
    budget_allocation = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Budget allocated to this committee"
    )
    
    # DEPRECATED: Keeping for backward compatibility, will be removed in migration
    event_type = models.CharField(max_length=100, default='General', blank=True)
    event_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVE', 'Active'),
            ('COMPLETED', 'Completed'),
            ('ARCHIVED', 'Archived'),
        ],
        default='ACTIVE',
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_committees'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'committees'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class CommitteeMember(models.Model):
    """CommitteeMember model for managing committee memberships"""
    
    ROLE_CHOICES = [
        ('TEAM_LEAD', 'Team Lead'),
        ('MEMBER', 'Member'),
    ]
    
    committee = models.ForeignKey(
        Committee,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='committee_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    is_lead = models.BooleanField(default=False)  # Keep for backward compatibility
    role_description = models.CharField(max_length=255, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'committee_members'
        unique_together = ['committee', 'user']
        ordering = ['-is_lead', 'joined_at']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.committee.name}"
    
    def save(self, *args, **kwargs):
        # Automatically set is_lead if role is TEAM_LEAD
        if self.role == 'TEAM_LEAD':
            self.is_lead = True
        super().save(*args, **kwargs)
