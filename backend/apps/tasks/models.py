from django.db import models
from django.conf import settings
from decimal import Decimal
from apps.committees.models import Committee


class Task(models.Model):
    """Task model for managing tasks - now event-centric"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    # NEW: Event-centric architecture
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='tasks',
        null=True,
        blank=True,
        help_text="Main event this task belongs to"
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    committee = models.ForeignKey(
        Committee,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    # NEW: Progress tracking
    progress_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Task completion percentage (0-100)"
    )

    estimated_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional estimated cost for task execution"
    )
    
    deadline = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-priority', 'deadline', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.committee.name}"


class TaskComment(models.Model):
    """TaskComment model for task discussions"""
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='task_comments'
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'task_comments'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.user.full_name} on {self.task.title}"
