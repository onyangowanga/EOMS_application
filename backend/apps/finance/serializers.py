from rest_framework import serializers
from .models import Collection, Expense
from apps.users.serializers import UserSerializer
from apps.committees.serializers import CommitteeSerializer


class CollectionSerializer(serializers.ModelSerializer):
    """Serializer for Collection"""
    
    recorded_by = UserSerializer(read_only=True)
    committee = CommitteeSerializer(read_only=True)
    
    class Meta:
        model = Collection
        fields = ['id', 'committee', 'payer_name', 'payer_phone', 'amount', 
                  'channel', 'reference_number', 'description', 'recorded_by',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'recorded_by', 'created_at', 'updated_at']


class CollectionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating collections"""
    
    committee_id = serializers.IntegerField()
    
    class Meta:
        model = Collection
        fields = ['committee_id', 'payer_name', 'payer_phone', 'amount', 
                  'channel', 'reference_number', 'description']


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense"""
    
    requested_by = UserSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    committee = CommitteeSerializer(read_only=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'committee', 'vendor', 'amount', 'category', 'description',
                  'receipt_url', 'status', 'requested_by', 'approved_by', 
                  'approved_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'requested_by', 'approved_by', 'approved_at',
                            'created_at', 'updated_at']


class ExpenseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating expenses"""
    
    committee_id = serializers.IntegerField()
    
    class Meta:
        model = Expense
        fields = ['committee_id', 'vendor', 'amount', 'category', 
                  'description', 'receipt_url']


class FinanceSummarySerializer(serializers.Serializer):
    """Serializer for finance summary"""
    
    total_collections = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_expenses = serializers.DecimalField(max_digits=10, decimal_places=2)
    approved_expenses = serializers.DecimalField(max_digits=10, decimal_places=2)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    collection_count = serializers.IntegerField()
    expense_count = serializers.IntegerField()
