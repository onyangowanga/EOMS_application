from celery import shared_task
from django.utils import timezone
from .models import Task
# TODO: Implement SMS/Email notification service


@shared_task
def send_task_reminders():
    """Send reminders for upcoming tasks"""
    upcoming_tasks = Task.objects.filter(
        status__in=['PENDING', 'IN_PROGRESS'],
        deadline__lte=timezone.now() + timezone.timedelta(hours=24),
        deadline__gte=timezone.now()
    )
    
    for task in upcoming_tasks:
        # TODO: Send SMS/Email notification to assigned user
        pass
    
    return f"Sent {upcoming_tasks.count()} task reminders"
