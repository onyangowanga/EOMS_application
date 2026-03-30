from rest_framework import serializers
from .models import Committee, CommitteeMember
from apps.users.serializers import UserSerializer


class CommitteeMemberSerializer(serializers.ModelSerializer):
    """Serializer for CommitteeMember"""
    
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CommitteeMember
        fields = ['id', 'user', 'user_id', 'is_lead', 'role_description', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class CommitteeSerializer(serializers.ModelSerializer):
    """Serializer for Committee with Phase 5 enhancements"""
    
    # Read-only display fields
    event_name = serializers.CharField(source='event.event_name', read_only=True)
    committee_type_display = serializers.CharField(source='get_committee_type_display', read_only=True)
    lead_name = serializers.CharField(source='lead.get_full_name', read_only=True, allow_null=True)
    lead_phone = serializers.CharField(source='lead.phone_number', read_only=True, allow_null=True)
    
    # Nested serializers
    members = CommitteeMemberSerializer(many=True, read_only=True)
    lead = UserSerializer(read_only=True)
    
    # Computed fields
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    tasks_completed = serializers.SerializerMethodField()
    operational_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Committee
        fields = [
            'id', 'event', 'event_name', 'name', 'description',
            'is_main', 'committee_type', 'committee_type_display',
            'lead', 'lead_name', 'lead_phone',
            'expected_activities', 'deadline', 'budget_allocation',
            'members', 'member_count',
            'task_count', 'tasks_completed', 'operational_progress',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_task_count(self, obj):
        return obj.tasks.count() if hasattr(obj, 'tasks') else 0
    
    def get_tasks_completed(self, obj):
        if hasattr(obj, 'tasks'):
            return obj.tasks.filter(status='COMPLETED').count()
        return 0
    
    def get_operational_progress(self, obj):
        """Calculate average progress of all tasks"""
        if not hasattr(obj, 'tasks'):
            return None
        
        from django.db.models import Avg
        avg_progress = obj.tasks.aggregate(
            avg=Avg('progress_percentage')
        )['avg']
        
        return float(avg_progress) if avg_progress else 0.0


class CommitteeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for committee lists"""
    
    event_name = serializers.CharField(source='event.event_name', read_only=True)
    committee_type_display = serializers.CharField(source='get_committee_type_display', read_only=True)
    lead_name = serializers.CharField(source='lead.get_full_name', read_only=True, allow_null=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Committee
        fields = [
            'id', 'event', 'event_name', 'name', 'is_main',
            'committee_type', 'committee_type_display',
            'lead_name', 'deadline', 'budget_allocation',
            'member_count'
        ]
    
    def get_member_count(self, obj):
        return obj.members.count()


class CommitteeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating committees with Phase 5 fields"""
    
    class Meta:
        model = Committee
        fields = [
            'event', 'name', 'description', 'is_main', 'committee_type',
            'lead', 'expected_activities', 'deadline', 'budget_allocation'
        ]
    
    def validate(self, data):
        # Ensure only one main committee per event
        if data.get('is_main'):
            event = data.get('event')
            if Committee.objects.filter(event=event, is_main=True).exists():
                raise serializers.ValidationError({
                    'is_main': 'This event already has a main committee'
                })
        return data


class AddMemberSerializer(serializers.Serializer):
    """Serializer for adding members to committee"""
    
    user_id = serializers.IntegerField()
    is_lead = serializers.BooleanField(default=False)
    role_description = serializers.CharField(max_length=255, required=False, allow_blank=True)


class CommitteeBudgetSerializer(serializers.Serializer):
    """Serializer for committee budget status"""
    
    committee_id = serializers.IntegerField()
    committee_name = serializers.CharField()
    budget_allocated = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=12, decimal_places=2)
    available = serializers.DecimalField(max_digits=12, decimal_places=2)
    utilization_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
