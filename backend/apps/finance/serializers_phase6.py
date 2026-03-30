from rest_framework import serializers
from .models import Collection, Expense
from apps.users.serializers import UserSerializer
from apps.committees.serializers import CommitteeSerializer
from decimal import Decimal


class CollectionSerializer(serializers.ModelSerializer):
    """Serializer for Collection with Phase 5 enhancements"""
    
    # Read-only display fields
    event_name = serializers.CharField(source='event.event_name', read_only=True, allow_null=True)
    cluster_name = serializers.CharField(source='cluster.name', read_only=True, allow_null=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True, allow_null=True)
    source_type_display = serializers.CharField(source='get_source_type_display', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True, allow_null=True)
    
    # Nested serializers
    recorded_by = UserSerializer(read_only=True)
    committee = CommitteeSerializer(read_only=True)
    
    class Meta:
        model = Collection
        fields = [
            'id', 'event', 'event_name',
            'cluster', 'cluster_name',
            'committee', 'committee_name',
            'source_type', 'source_type_display',
            'payer_name', 'payer_phone', 'amount',
            'channel', 'reference_number', 'description',
            'recorded_by', 'recorded_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'recorded_by', 'created_at', 'updated_at']


class CollectionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for collection lists"""
    
    event_name = serializers.CharField(source='event.event_name', read_only=True, allow_null=True)
    cluster_name = serializers.CharField(source='cluster.name', read_only=True, allow_null=True)
    source_type_display = serializers.CharField(source='get_source_type_display', read_only=True)
    
    class Meta:
        model = Collection
        fields = [
            'id', 'event', 'event_name', 'cluster', 'cluster_name',
            'source_type', 'source_type_display',
            'payer_name', 'amount', 'created_at'
        ]


class CollectionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating collections with Phase 5 fields"""
    
    committee_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Collection
        fields = [
            'event', 'cluster', 'committee_id', 'source_type',
            'payer_name', 'payer_phone', 'amount',
            'channel', 'reference_number', 'description'
        ]
    
    def validate(self, data):
        # If source_type is CLUSTER, cluster must be provided
        if data.get('source_type') == 'CLUSTER' and not data.get('cluster'):
            raise serializers.ValidationError({
                'cluster': 'Cluster must be specified for CLUSTER source type'
            })
        return data


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense with Phase 5 enhancements (3-tier approval)"""
    
    # Read-only display fields
    event_name = serializers.CharField(source='event.event_name', read_only=True, allow_null=True)
    budget_item_name = serializers.CharField(source='budget_item.item_name', read_only=True, allow_null=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True, allow_null=True)
    chair_name = serializers.CharField(source='approved_by_chair.get_full_name', read_only=True, allow_null=True)
    treasurer_name = serializers.CharField(source='approved_by_treasurer.get_full_name', read_only=True, allow_null=True)
    finance_name = serializers.CharField(source='approved_by_finance.get_full_name', read_only=True, allow_null=True)
    
    # Nested serializers
    requested_by = UserSerializer(read_only=True)
    approved_by_chair = UserSerializer(read_only=True)
    approved_by_treasurer = UserSerializer(read_only=True)
    approved_by_finance = UserSerializer(read_only=True)
    committee = CommitteeSerializer(read_only=True)
    
    # Computed fields
    approval_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'event', 'event_name',
            'budget_item', 'budget_item_name',
            'committee', 'committee_name',
            'vendor', 'amount', 'category', 'category_display',
            'description', 'receipt_url',
            'status', 'status_display', 'approval_progress',
            'requested_by', 'requested_by_name',
            'approved_by_chair', 'chair_name',
            'approved_by_treasurer', 'treasurer_name',
            'approved_by_finance', 'finance_name',
            'paid_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'requested_by', 'approved_by_chair',
            'approved_by_treasurer', 'approved_by_finance',
            'paid_at', 'created_at', 'updated_at'
        ]
    
    def get_approval_progress(self, obj):
        """Get approval workflow progress"""
        approved_count = 0
        if obj.approved_by_chair:
            approved_count += 1
        if obj.approved_by_treasurer:
            approved_count += 1
        if obj.approved_by_finance:
            approved_count += 1
        
        return f"{approved_count}/3 approvals"


class ExpenseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for expense lists"""
    
    event_name = serializers.CharField(source='event.event_name', read_only=True, allow_null=True)
    budget_item_name = serializers.CharField(source='budget_item.item_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'event', 'event_name', 'budget_item', 'budget_item_name',
            'vendor', 'amount', 'status', 'status_display',
            'requested_by_name', 'created_at'
        ]


class ExpenseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating expenses with Phase 5 fields"""
    
    committee_id = serializers.IntegerField()
    
    class Meta:
        model = Expense
        fields = [
            'event', 'budget_item', 'committee_id',
            'vendor', 'amount', 'category',
            'description', 'receipt_url'
        ]
    
    def validate(self, data):
        # If budget_item is specified, check if there's enough budget
        budget_item = data.get('budget_item')
        if budget_item:
            from apps.events.models import BudgetItem
            try:
                budget = BudgetItem.objects.get(id=budget_item.id)
                available = budget.allocated_amount - budget.spent_amount
                
                if data.get('amount', 0) > available:
                    raise serializers.ValidationError({
                        'amount': f'Amount exceeds available budget. Available: KES {available}'
                    })
            except BudgetItem.DoesNotExist:
                pass
        
        return data


class FinanceSummarySerializer(serializers.Serializer):
    """Serializer for finance summary"""
    
    total_collections = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    approved_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    collection_count = serializers.IntegerField()
    expense_count = serializers.IntegerField()
    
    # Phase 5 additions
    cluster_collections = serializers.DecimalField(max_digits=12, decimal_places=2)
    general_collections = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses_by_status = serializers.DictField()
