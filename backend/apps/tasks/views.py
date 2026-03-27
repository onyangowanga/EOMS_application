from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Task, TaskComment
from .serializers import (
    TaskSerializer, TaskCreateSerializer, TaskUpdateSerializer,
    TaskCommentSerializer
)


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Task CRUD operations"""
    
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Task.objects.all()
        
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
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        return TaskSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update task status"""
        task = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Task.STATUS_CHOICES):
            return Response({
                'error': 'Invalid status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        task.status = new_status
        
        if new_status == 'COMPLETED':
            task.completed_at = timezone.now()
        
        task.save()
        
        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to the task"""
        task = self.get_object()
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
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
