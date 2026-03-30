from rest_framework import serializers
from .models import (
    Event, EventMember, ClusterGroup, ClusterContribution, ClusterDeposit,
    BudgetItem, BudgetAdjustmentRequest, EventSchedule, AuditLog, Notification
)
from apps.users.serializers import UserSerializer


class EventMemberSerializer(serializers.ModelSerializer):
    """Serializer for EventMember model"""
    user_details = UserSerializer(source='user', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    is_official = serializers.BooleanField(read_only=True)
    has_super_admin_rights = serializers.BooleanField(read_only=True)
    can_approve_expenses = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = EventMember
        fields = [
            'id', 'event', 'user', 'user_details', 'role', 'role_display',
            'full_name', 'phone', 'alternative_phone', 'email', 'is_active',
            'is_official', 'has_super_admin_rights', 'can_approve_expenses',
            'joined_at', 'updated_at'
        ]
        read_only_fields = ['id', 'joined_at', 'updated_at']


class EventListSerializer(serializers.ModelSerializer):
    """Serializer for Event list view (summary)"""
    event_name = serializers.CharField(source='name', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    days_until_event = serializers.IntegerField(read_only=True)
    financial_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    overall_progress = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'event_name', 'event_type', 'event_type_display', 'event_date',
            'location', 'status', 'status_display', 'days_until_event',
            'financial_progress', 'operational_progress', 'overall_progress',
            'total_budget', 'total_collected', 'total_spent', 'financial_balance',
            'member_count', 'created_at', 'updated_at'
        ]
    
    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class EventDetailSerializer(serializers.ModelSerializer):
    """Serializer for Event detail view (full details)"""
    event_name = serializers.CharField(source='name', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    days_until_event = serializers.IntegerField(read_only=True)
    financial_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    overall_progress = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    members = EventMemberSerializer(many=True, read_only=True)
    chairman = serializers.SerializerMethodField()
    secretary = serializers.SerializerMethodField()
    treasurer = serializers.SerializerMethodField()
    event_owners = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'event_name', 'event_type', 'event_type_display', 'event_date',
            'location', 'description', 'status', 'status_display',
            'days_until_event', 'financial_progress', 'operational_progress',
            'overall_progress', 'total_budget', 'total_collected', 'total_spent',
            'financial_balance', 'members', 'chairman', 'secretary', 'treasurer',
            'event_owners', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_chairman(self, obj):
        member = obj.members.filter(role='CHAIRMAN', is_active=True).first()
        return EventMemberSerializer(member).data if member else None
    
    def get_secretary(self, obj):
        member = obj.members.filter(role='SECRETARY', is_active=True).first()
        return EventMemberSerializer(member).data if member else None
    
    def get_treasurer(self, obj):
        member = obj.members.filter(role='TREASURER', is_active=True).first()
        return EventMemberSerializer(member).data if member else None
    
    def get_event_owners(self, obj):
        members = obj.members.filter(role='EVENT_OWNER', is_active=True)
        return EventMemberSerializer(members, many=True).data


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new events"""
    
    # Accept event_name from frontend but map to name field
    event_name = serializers.CharField(source='name', max_length=255)
    
    # Make status and total_budget optional with defaults
    status = serializers.CharField(required=False, default='PLANNING')
    total_budget = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        required=False, 
        default=0
    )
    
    class Meta:
        model = Event
        fields = [
            'id', 'event_name', 'event_type', 'event_date', 'location', 'description',
            'status', 'total_budget', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True},
        }
    
    def create(self, validated_data):
        from apps.users.models import User
        from apps.committees.models import Committee, CommitteeMember
        
        # Get the request user and committee data from context
        request = self.context.get('request')
        user = request.user if request else None
        committee_members_data = request.data.get('committee_members', {}) if request else {}
        
        # Set defaults if not provided
        if 'status' not in validated_data:
            validated_data['status'] = 'PLANNING'
        if 'total_budget' not in validated_data:
            validated_data['total_budget'] = 0
        
        # Create the event
        event = Event.objects.create(**validated_data)
        
        # Automatically add creator as EVENT_OWNER
        owner_member = None
        if user:
            owner_member = EventMember.objects.create(
                event=event,
                user=user,
                role='EVENT_OWNER',
                full_name=user.full_name if hasattr(user, 'full_name') else user.username,
                phone=user.phone if hasattr(user, 'phone') else '',
                email=user.email or '',
                is_active=True
            )
        
        # Create executive committee members
        committee_event_members = [owner_member] if owner_member else []
        
        # Helper function to create or get user account
        def get_or_create_user(member_data, role_name):
            if not member_data.get('full_name') or not member_data.get('phone'):
                return None, None
            
            # Try to find existing user by phone
            user_obj = User.objects.filter(phone=member_data['phone']).first()
            
            if not user_obj:
                # Create new user account
                username = f"{member_data['phone']}"  # Use phone as username
                user_obj = User.objects.create_user(
                    username=username,
                    phone=member_data['phone'],
                    email=member_data.get('email', ''),
                    full_name=member_data['full_name'],
                )
                # Set a temporary random password (they'll use OTP to login)
                import random
                import string
                temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
                user_obj.set_password(temp_password)
                user_obj.save()
            
            # Create EventMember
            event_member = EventMember.objects.create(
                event=event,
                user=user_obj,
                role=role_name,
                full_name=member_data['full_name'],
                phone=member_data['phone'],
                email=member_data.get('email', ''),
                is_active=True
            )
            
            return user_obj, event_member
        
        # Create Chairman
        if committee_members_data.get('chairman'):
            _, chairman_member = get_or_create_user(
                committee_members_data['chairman'],
                'CHAIRMAN'
            )
            if chairman_member:
                committee_event_members.append(chairman_member)
        
        # Create Treasurer
        if committee_members_data.get('treasurer'):
            _, treasurer_member = get_or_create_user(
                committee_members_data['treasurer'],
                'TREASURER'
            )
            if treasurer_member:
                committee_event_members.append(treasurer_member)
        
        # Create Secretary
        if committee_members_data.get('secretary'):
            _, secretary_member = get_or_create_user(
                committee_members_data['secretary'],
                'SECRETARY'
            )
            if secretary_member:
                committee_event_members.append(secretary_member)
        
        # Create Executive Committee
        if committee_event_members:
            lead_user = None
            for m in committee_event_members:
                if m and m.role == 'CHAIRMAN':
                    lead_user = m.user
                    break

            executive_committee = Committee.objects.create(
                event=event,
                name='Executive Committee',
                description='Main executive committee comprising the event owner and key officials',
                committee_type='MAIN',
                status='ACTIVE',
                is_main=True,
                created_by=user,
                lead=lead_user
            )
            
            # Add all members to the committee
            for event_member in committee_event_members:
                if event_member:
                    CommitteeMember.objects.create(
                        committee=executive_committee,
                        user=event_member.user,
                        is_lead=(event_member.role == 'CHAIRMAN')
                    )
        
        return event


# ==================== CLUSTER SERIALIZERS ====================

class ClusterContributionSerializer(serializers.ModelSerializer):
    """Serializer for ClusterContribution model"""
    recorded_by_details = UserSerializer(source='recorded_by', read_only=True)
    payment_channel_display = serializers.CharField(source='get_payment_channel_display', read_only=True)
    
    class Meta:
        model = ClusterContribution
        fields = [
            'id', 'cluster', 'contributor_name', 'contributor_phone', 'amount',
            'is_pledge', 'pledge_fulfilled', 'pledge_fulfillment_date',
            'payment_channel', 'payment_channel_display', 'reference_number',
            'notes', 'recorded_by', 'recorded_by_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'pledge_fulfillment_date']


class ClusterDepositSerializer(serializers.ModelSerializer):
    """Serializer for ClusterDeposit model"""
    deposited_by_details = UserSerializer(source='deposited_by', read_only=True)
    confirmed_by_details = UserSerializer(source='confirmed_by', read_only=True)
    deposit_channel_display = serializers.CharField(source='get_deposit_channel_display', read_only=True)
    cluster_name = serializers.CharField(source='cluster.name', read_only=True)
    
    class Meta:
        model = ClusterDeposit
        fields = [
            'id', 'cluster', 'cluster_name', 'amount', 'deposited_by', 'deposited_by_details',
            'deposit_channel', 'deposit_channel_display', 'reference_number',
            'confirmed_by_treasurer', 'confirmed_by', 'confirmed_by_details',
            'treasurer_confirmation_date', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'confirmed_by', 
                           'treasurer_confirmation_date']


class ClusterGroupListSerializer(serializers.ModelSerializer):
    """Serializer for ClusterGroup list view (summary)"""
    cluster_lead_name = serializers.CharField(source='cluster_lead.full_name', read_only=True)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    progress_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    pending_in_lead_account = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = ClusterGroup
        fields = [
            'id', 'event', 'name', 'cluster_lead', 'cluster_lead_name',
            'target_amount', 'collected_amount', 'pledged_amount', 'balance',
            'progress_percentage', 'funds_in_lead_account', 'submitted_to_treasurer',
            'pending_in_lead_account', 'created_at', 'updated_at'
        ]


class ClusterGroupDetailSerializer(serializers.ModelSerializer):
    """Serializer for ClusterGroup detail view with contributions and deposits"""
    cluster_lead_details = UserSerializer(source='cluster_lead', read_only=True)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    progress_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    pending_in_lead_account = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    contributions = ClusterContributionSerializer(many=True, read_only=True)
    deposits = ClusterDepositSerializer(many=True, read_only=True)
    contribution_count = serializers.SerializerMethodField()
    pledge_count = serializers.SerializerMethodField()
    pending_deposit_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ClusterGroup
        fields = [
            'id', 'event', 'funds_mobilization_committee', 'name',
            'cluster_lead', 'cluster_lead_details', 'target_amount',
            'collected_amount', 'pledged_amount', 'balance', 'progress_percentage',
            'funds_in_lead_account', 'submitted_to_treasurer', 'pending_in_lead_account',
            'contributions', 'deposits', 'contribution_count', 'pledge_count',
            'pending_deposit_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_contribution_count(self, obj):
        return obj.contributions.filter(is_pledge=False).count()
    
    def get_pledge_count(self, obj):
        return obj.contributions.filter(is_pledge=True, pledge_fulfilled=False).count()
    
    def get_pending_deposit_count(self, obj):
        return obj.deposits.filter(confirmed_by_treasurer=False).count()


class ClusterGroupCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new cluster groups"""
    
    class Meta:
        model = ClusterGroup
        fields = [
            'event', 'funds_mobilization_committee', 'name', 'cluster_lead',
            'target_amount', 'funds_in_lead_account'
        ]


# ==================== Budget Serializers ====================

class BudgetItemSerializer(serializers.ModelSerializer):
    """Basic budget item serializer"""
    
    event_name = serializers.CharField(source='event.name', read_only=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    
    # Calculated fields
    remaining_balance = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    utilization_percentage = serializers.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        read_only=True
    )
    is_over_budget = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = BudgetItem
        fields = [
            'id', 'event', 'event_name', 'committee', 'committee_name',
            'item_name', 'description', 'category', 'allocated_amount', 'spent_amount',
            'remaining_balance', 'utilization_percentage', 'is_over_budget',
            'status', 'status_display', 'created_by', 'created_by_details',
            'approved_by', 'approved_by_details', 'approved_at',
            'created_at', 'updated_at'
        ]


class BudgetItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for budget item lists"""
    
    event_name = serializers.CharField(source='event.name', read_only=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remaining_balance = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    utilization_percentage = serializers.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = BudgetItem
        fields = [
            'id', 'event_name', 'committee_name', 'item_name', 'category',
            'allocated_amount', 'spent_amount', 'remaining_balance',
            'utilization_percentage', 'status', 'status_display', 'created_at'
        ]


class BudgetItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating budget items"""
    
    class Meta:
        model = BudgetItem
        fields = [
            'event', 'committee', 'item_name', 'description', 'category',
            'allocated_amount'
        ]


class BudgetAdjustmentRequestSerializer(serializers.ModelSerializer):
    """Serializer for budget adjustment requests"""
    
    budget_item_name = serializers.CharField(source='budget_item.item_name', read_only=True)
    adjustment_type_display = serializers.CharField(source='get_adjustment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    requested_by_details = UserSerializer(source='requested_by', read_only=True)
    reviewed_by_details = UserSerializer(source='reviewed_by', read_only=True)
    
    class Meta:
        model = BudgetAdjustmentRequest
        fields = [
            'id', 'budget_item', 'budget_item_name', 'adjustment_type',
            'adjustment_type_display', 'original_amount', 'requested_amount',
            'adjustment_amount', 'reason', 'supporting_documents',
            'status', 'status_display', 'requested_by', 'requested_by_details',
            'reviewed_by', 'reviewed_by_details', 'review_notes', 'reviewed_at',
            'created_at', 'updated_at'
        ]


class BudgetAdjustmentRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating budget adjustment requests"""
    
    class Meta:
        model = BudgetAdjustmentRequest
        fields = [
            'budget_item', 'adjustment_type', 'original_amount', 
            'requested_amount', 'reason', 'supporting_documents'
        ]
    
    def validate(self, data):
        """Validate that requested amount is different from original"""
        if data['requested_amount'] == data['original_amount']:
            raise serializers.ValidationError(
                "Requested amount must be different from original amount"
            )
        return data


class EventScheduleSerializer(serializers.ModelSerializer):
    """Serializer for EventSchedule model"""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    
    class Meta:
        model = EventSchedule
        fields = [
            'id', 'event', 'event_name', 'title', 'description', 'schedule_type',
            'start_datetime', 'end_datetime', 'location', 'status', 'is_public',
            'committee', 'committee_name', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'event_name', 
                          'committee_name', 'created_by_name']


class EventScheduleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing schedules"""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = EventSchedule
        fields = [
            'id', 'title', 'schedule_type', 'start_datetime', 'end_datetime',
            'location', 'status', 'is_public', 'created_by_name'
        ]


class EventScheduleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating event schedules"""
    
    class Meta:
        model = EventSchedule
        fields = [
            'event', 'title', 'description', 'schedule_type', 'start_datetime',
            'end_datetime', 'location', 'is_public', 'committee'
        ]
    
    def validate(self, data):
        """Validate datetime range"""
        if data.get('end_datetime') and data.get('start_datetime'):
            if data['end_datetime'] <= data['start_datetime']:
                raise serializers.ValidationError(
                    "End datetime must be after start datetime"
                )
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model (read-only)"""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'event', 'event_name', 'user', 'user_name', 'action', 
            'action_display', 'model_name', 'object_id', 'object_repr', 'changes',
            'description', 'ip_address', 'timestamp'
        ]
        read_only_fields = '__all__'  # All fields are read-only


class AuditLogListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing audit logs"""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'timestamp', 'user_name', 'action_display', 'model_name',
            'object_repr', 'description'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'event', 'event_name', 'recipient', 'recipient_name',
            'notification_type', 'notification_type_display', 'channel', 
            'channel_display', 'subject', 'message', 'phone_number', 
            'email_address', 'status', 'status_display', 'sent_at', 
            'error_message', 'related_object_model', 'related_object_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sent_at', 'created_at', 'updated_at',
                          'event_name', 'recipient_name', 'notification_type_display',
                          'channel_display', 'status_display']


class NotificationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing notifications"""
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'subject', 'recipient_name', 'notification_type_display',
            'channel', 'status', 'created_at', 'sent_at'
        ]


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""
    
    class Meta:
        model = Notification
        fields = [
            'event', 'recipient', 'notification_type', 'channel',
            'subject', 'message', 'phone_number', 'email_address',
            'related_object_model', 'related_object_id'
        ]
    
    def validate(self, data):
        """Validate contact details based on channel"""
        channel = data.get('channel')
        
        if channel in ['SMS', 'BOTH'] and not data.get('phone_number'):
            raise serializers.ValidationError(
                "Phone number is required for SMS notifications"
            )
        
        if channel in ['EMAIL', 'BOTH'] and not data.get('email_address'):
            raise serializers.ValidationError(
                "Email address is required for email notifications"
            )
        
        return data


