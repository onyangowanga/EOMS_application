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
    """Serializer for Committee"""
    
    members = CommitteeMemberSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Committee
        fields = ['id', 'name', 'description', 'event_type', 'event_date', 
                  'status', 'created_by', 'members', 'member_count', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()


class CommitteeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating committees"""
    
    class Meta:
        model = Committee
        fields = ['name', 'description', 'event_type', 'event_date', 'status']


class AddMemberSerializer(serializers.Serializer):
    """Serializer for adding members to committee"""
    
    user_id = serializers.IntegerField()
    is_lead = serializers.BooleanField(default=False)
    role_description = serializers.CharField(max_length=255, required=False, allow_blank=True)
