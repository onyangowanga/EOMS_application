from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Avg, Q
from decimal import Decimal

from .models import Task, TaskComment
from .serializers import (
    TaskSerializer, TaskCreateSerializer, TaskUpdateSerializer, TaskListSerializer,
    TaskCommentSerializer, TaskProgressUpdateSerializer
)
from apps.events.models import BudgetItem
from apps.committees.models import CommitteeMember


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Task CRUD operations with Phase 5 enhancements"""
    
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Task.objects.all()
        
        # Filter by event
        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by committee
        committee_id = self.request.query_params.get('committee')
        if committee_id:
            queryset = queryset.filter(committee_id=committee_id)
        
        # Filter by assigned user
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        
        # Filter by status
        task_status = self.request.query_params.get('status')
        if task_status:
            queryset = queryset.filter(status=task_status)
        
        # Filter by progress range
        min_progress = self.request.query_params.get('min_progress')
        max_progress = self.request.query_params.get('max_progress')
        
        if min_progress:
            queryset = queryset.filter(progress_percentage__gte=Decimal(min_progress))
        
        if max_progress:
            queryset = queryset.filter(progress_percentage__lte=Decimal(max_progress))
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        elif self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        return TaskSerializer

    def _is_team_lead_for_committee(self, user, committee_id):
        if not committee_id:
            return False
        return CommitteeMember.objects.filter(
            committee_id=committee_id,
            user=user,
            role='TEAM_LEAD',
        ).exists()

    def create(self, request, *args, **kwargs):
        committee_id = request.data.get('committee_id')

        if not committee_id:
            return Response({'error': 'committee_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._is_team_lead_for_committee(request.user, committee_id):
            return Response({
                'error': 'Only the assigned team lead can add activities for this committee'
            }, status=status.HTTP_403_FORBIDDEN)

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        if not self._is_team_lead_for_committee(request.user, task.committee_id):
            return Response({'error': 'Read-only access: only team lead can modify activities'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        task = self.get_object()
        if not self._is_team_lead_for_committee(request.user, task.committee_id):
            return Response({'error': 'Read-only access: only team lead can modify activities'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        if not self._is_team_lead_for_committee(request.user, task.committee_id):
            return Response({'error': 'Read-only access: only team lead can delete activities'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)

        if task.estimated_cost and task.estimated_cost > Decimal('0.00'):
            task_event = task.event or task.committee.event
            if task_event:
                BudgetItem.objects.create(
                    event=task_event,
                    committee=task.committee,
                    linked_task=task,
                    item_name=task.title,
                    description=task.description or f"Auto-created from task #{task.id}",
                    category='OTHER',
                    allocated_amount=task.estimated_cost,
                    status='PENDING',
                    created_by=None,
                )
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update task status"""
        task = self.get_object()
        if not self._is_team_lead_for_committee(request.user, task.committee_id):
            return Response({'error': 'Read-only access: only team lead can update task status'}, status=status.HTTP_403_FORBIDDEN)
        new_status = request.data.get('status')
        
        if new_status not in dict(Task.STATUS_CHOICES):
            return Response({
                'error': 'Invalid status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        task.status = new_status
        
        if new_status == 'COMPLETED':
            task.completed_at = timezone.now()
            task.progress_percentage = Decimal('100.00')
        
        task.save()
        
        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=['patch'])
    def update_progress(self, request, pk=None):
        """Update task progress percentage"""
        task = self.get_object()
        if not self._is_team_lead_for_committee(request.user, task.committee_id):
            return Response({'error': 'Read-only access: only team lead can update task progress'}, status=status.HTTP_403_FORBIDDEN)
        serializer = TaskProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        progress = serializer.validated_data['progress_percentage']
        task.progress_percentage = progress
        
        # Automatically update status based on progress
        if progress == Decimal('100.00') and task.status != 'COMPLETED':
            task.status = 'COMPLETED'
            task.completed_at = timezone.now()
        elif progress > 0 and task.status == 'TODO':
            task.status = 'IN_PROGRESS'
        
        task.save()
        
        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to the task"""
        task = self.get_object()
        if not self._is_team_lead_for_committee(request.user, task.committee_id):
            return Response({'error': 'Read-only access: only team lead can comment on activities'}, status=status.HTTP_403_FORBIDDEN)
        comment_text = request.data.get('comment')
        
        if not comment_text:
            return Response({
                'error': 'Comment is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        comment = TaskComment.objects.create(
            task=task,
            user=request.user,
            comment=comment_text
        )
        
        return Response(
            TaskCommentSerializer(comment).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get all comments for the task"""
        task = self.get_object()
        comments = task.comments.all()
        serializer = TaskCommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get tasks assigned to current user"""
        tasks = Task.objects.filter(assigned_to=request.user)
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_event(self, request):
        """Get all tasks for a specific event"""
        event_id = request.query_params.get('event_id')
        
        if not event_id:
            return Response({
                'error': 'event_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        tasks = Task.objects.filter(event_id=event_id)
        serializer = TaskListSerializer(tasks, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def event_progress(self, request):
        """Get overall progress for an event's tasks"""
        event_id = self.request.query_params.get('event_id')
        
        if not event_id:
            return Response({
                'error': 'event_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        tasks = Task.objects.filter(event_id=event_id)
        
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='COMPLETED').count()
        in_progress_tasks = tasks.filter(status='IN_PROGRESS').count()
        pending_tasks = tasks.filter(status='TODO').count()
        
        # Calculate average progress
        avg_progress = tasks.aggregate(
            avg=Avg('progress_percentage')
        )['avg'] or Decimal('0.00')
        
        return Response({
            'event_id': event_id,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': in_progress_tasks,
            'pending_tasks': pending_tasks,
            'average_progress': float(avg_progress),
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        })
    
    @action(detail=False, methods=['get'])
    def overdue_tasks(self, request):
        """Get overdue tasks"""
        today = timezone.now().date()
        
        tasks = Task.objects.filter(
            deadline__lt=today,
            status__in=['TODO', 'IN_PROGRESS']
        )
        
        # Filter by event if provided
        event_id = request.query_params.get('event_id')
        if event_id:
            tasks = tasks.filter(event_id=event_id)
        
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def not_started(self, request):
        """Get tasks that haven't been started (progress = 0)"""
        tasks = Task.objects.filter(
            progress_percentage=Decimal('0.00'),
            status='TODO'
        )
        
        # Filter by event if provided
        event_id = request.query_params.get('event_id')
        if event_id:
            tasks = tasks.filter(event_id=event_id)
        
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
