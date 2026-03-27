from rest_framework import serializers
from .models import Task, TaskComment
from apps.users.serializers import UserSerializer
from apps.committees.serializers import CommitteeSerializer


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for TaskComment"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task"""
    
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    committee = CommitteeSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'committee', 'assigned_to', 
                  'created_by', 'status', 'priority', 'deadline', 'completed_at',
                  'comments', 'comment_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'completed_at', 'created_at', 'updated_at']
    
    def get_comment_count(self, obj):
        return obj.comments.count()


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks"""
    
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
    committee_id = serializers.IntegerField()
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'committee_id', 'assigned_to_id', 
                  'priority', 'deadline']


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tasks"""
    
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'assigned_to_id', 'status', 
                  'priority', 'deadline']
