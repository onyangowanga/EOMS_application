from django.db import models
from django.conf import settings


class Committee(models.Model):
    """Committee model for managing event committees"""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=100, default='General')
    event_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVE', 'Active'),
            ('COMPLETED', 'Completed'),
            ('ARCHIVED', 'Archived'),
        ],
        default='ACTIVE'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
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
    is_lead = models.BooleanField(default=False)
    role_description = models.CharField(max_length=255, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'committee_members'
        unique_together = ['committee', 'user']
        ordering = ['-is_lead', 'joined_at']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.committee.name}"
