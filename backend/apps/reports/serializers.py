from rest_framework import serializers


class CommitteeReportSerializer(serializers.Serializer):
    """Serializer for committee activity report"""
    
    committee_name = serializers.CharField()
    committee_id = serializers.IntegerField()
    member_count = serializers.IntegerField()
    task_count = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    pending_tasks = serializers.IntegerField()
    total_collections = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=10, decimal_places=2)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    provider_count = serializers.IntegerField()


class EventSummarySerializer(serializers.Serializer):
    """Serializer for event summary report"""
    
    committee_name = serializers.CharField()
    event_type = serializers.CharField()
    event_date = serializers.DateField()
    status = serializers.CharField()
    total_members = serializers.IntegerField()
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    total_collections = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=10, decimal_places=2)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    providers_used = serializers.IntegerField()


class UserActivitySerializer(serializers.Serializer):
    """Serializer for user activity report"""
    
    user_id = serializers.IntegerField()
    full_name = serializers.CharField()
    role = serializers.CharField()
    committees_joined = serializers.IntegerField()
    tasks_assigned = serializers.IntegerField()
    tasks_completed = serializers.IntegerField()
    collections_recorded = serializers.IntegerField()
    expenses_requested = serializers.IntegerField()
