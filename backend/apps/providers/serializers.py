from rest_framework import serializers
from .models import ServiceProvider
from apps.users.serializers import UserSerializer
from apps.committees.serializers import CommitteeSerializer


class ServiceProviderSerializer(serializers.ModelSerializer):
    """Serializer for ServiceProvider"""
    
    added_by = UserSerializer(read_only=True)
    committee = CommitteeSerializer(read_only=True)
    
    class Meta:
        model = ServiceProvider
        fields = ['id', 'committee', 'name', 'provider_type', 'contact_person', 
                  'phone', 'email', 'address', 'cost_estimate', 'actual_cost',
                  'status', 'notes', 'added_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'added_by', 'created_at', 'updated_at']


class ServiceProviderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating service providers"""
    
    committee_id = serializers.IntegerField()
    
    class Meta:
        model = ServiceProvider
        fields = ['committee_id', 'name', 'provider_type', 'contact_person', 
                  'phone', 'email', 'address', 'cost_estimate', 'notes']
