from rest_framework import serializers
from .models import Task, TaskComment
from apps.users.serializers import UserSerializer
from apps.committees.serializers import CommitteeSerializer
from decimal import Decimal


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for TaskComment"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task with Phase 5 enhancements"""
    
    # Read-only display fields
    event_name = serializers.CharField(source='event.event_name', read_only=True, allow_null=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    # Nested serializers
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    committee = CommitteeSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    
    # Computed fields
    comment_count = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    progress_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'event', 'event_name', 'title', 'description',
            'committee', 'committee_name',
            'assigned_to', 'assigned_to_name',
            'created_by', 'created_by_name',
            'status', 'status_display',
            'priority', 'priority_display',
            'estimated_cost',
            'progress_percentage', 'progress_status',
            'deadline', 'days_remaining', 'completed_at',
            'comments', 'comment_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'completed_at', 'created_at', 'updated_at']
    
    def get_comment_count(self, obj):
        return obj.comments.count()
    
    def get_days_remaining(self, obj):
        if not obj.deadline:
            return None
        
        from django.utils import timezone
        from datetime import timedelta
        
        if not obj.deadline:
            return None
        
        today = timezone.now().date()
        # Convert datetime deadline to date for comparison
        deadline_date = obj.deadline.date() if hasattr(obj.deadline, 'date') else obj.deadline
        delta = deadline_date - today
        return delta.days
    
    def get_progress_status(self, obj):
        """Get human-readable progress status"""
        progress = obj.progress_percentage
        
        if progress >= 100:
            return "Completed"
        elif progress >= 75:
            return "Almost Done"
        elif progress >= 50:
            return "In Progress"
        elif progress > 0:
            return "Started"
        else:
            return "Not Started"


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for task lists"""
    
    event_name = serializers.CharField(source='event.event_name', read_only=True, allow_null=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True, allow_null=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    progress_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'event', 'event_name', 'title',
            'committee_name', 'assigned_to_name',
            'status', 'status_display', 'priority',
            'estimated_cost', 'progress_percentage', 'progress_status',
            'deadline'
        ]
    
    def get_progress_status(self, obj):
        progress = obj.progress_percentage
        if progress >= 100:
            return "Completed"
        elif progress >= 75:
            return "Almost Done"
        elif progress >= 50:
            return "In Progress"
        elif progress > 0:
            return "Started"
        return "Not Started"


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks with Phase 5 fields"""
    
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
    committee_id = serializers.IntegerField()
    
    class Meta:
        model = Task
        fields = [
            'event', 'title', 'description', 'committee_id', 'assigned_to_id',
            'priority', 'deadline', 'progress_percentage', 'estimated_cost'
        ]
    
    def validate_progress_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Progress percentage must be between 0 and 100")
        return value


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tasks"""
    
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'assigned_to_id', 'status',
            'priority', 'deadline', 'progress_percentage', 'estimated_cost'
        ]
    
    def validate_progress_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Progress percentage must be between 0 and 100")
        return value


class TaskProgressUpdateSerializer(serializers.Serializer):
    """Serializer for updating task progress"""
    
    progress_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=Decimal('0.00'),
        max_value=Decimal('100.00')
    )
