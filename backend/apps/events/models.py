from django.db import models
from django.utils import timezone
from decimal import Decimal


class Event(models.Model):
    """Main event entity - one event per instance"""
    
    EVENT_TYPE_CHOICES = [
        ('FUNERAL', 'Funeral'),
        ('WEDDING', 'Wedding'),
        ('CORPORATE', 'Corporate Event'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('PLANNING', 'Planning'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=255, help_text="e.g., 'John Doe Funeral'")
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='FUNERAL')
    event_date = models.DateField(help_text="Main event date")
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNING')
    
    # Progress tracking
    financial_progress = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Financial progress percentage (0-100)"
    )
    operational_progress = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Operational progress percentage (0-100)"
    )
    
    # Financial summary fields (calculated from related data)
    total_budget = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_collected = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-event_date']
        indexes = [
            models.Index(fields=['event_date', 'status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.event_date}"
    
    @property
    def days_until_event(self):
        """Calculate days remaining until event"""
        if self.event_date:
            delta = self.event_date - timezone.now().date()
            return delta.days
        return None
    
    @property
    def financial_balance(self):
        """Available funds"""
        return self.total_collected - self.total_spent
    
    @property
    def overall_progress(self):
        """Overall progress (average of financial and operational)"""
        return (self.financial_progress + self.operational_progress) / 2
    
    def update_financial_progress(self):
        """Recalculate financial progress based on collections vs budget"""
        if self.total_budget > 0:
            self.financial_progress = (self.total_collected / self.total_budget) * 100
            self.save(update_fields=['financial_progress'])
    
    def update_operational_progress(self):
        """Recalculate operational progress based on completed tasks"""
        from apps.tasks.models import Task
        
        total_tasks = Task.objects.filter(event=self).count()
        if total_tasks > 0:
            completed_tasks = Task.objects.filter(
                event=self,
                status='COMPLETED'
            ).count()
            self.operational_progress = (completed_tasks / total_tasks) * 100
            self.save(update_fields=['operational_progress'])


class EventMember(models.Model):
    """Members of the main event committee"""
    
    ROLE_CHOICES = [
        ('CHAIRMAN', 'Chairman'),
        ('SECRETARY', 'Secretary'),
        ('TREASURER', 'Treasurer'),
        ('EVENT_OWNER', 'Event Owner'),  # Bereaved, Bride, Groom, etc.
        ('TEAM_LEAD', 'Team Lead'),  # Subcommittee lead
        ('CLUSTER_LEAD', 'Cluster Lead'),  # Cluster group lead
        ('MEMBER', 'Committee Member'),
    ]
    
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE, 
        related_name='members'
    )
    user = models.ForeignKey(
        'users.User', 
        on_delete=models.CASCADE,
        related_name='event_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    alternative_phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # Permissions
    is_active = models.BooleanField(default=True)
    
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['event', 'role']
        unique_together = [['event', 'user', 'role']]
        indexes = [
            models.Index(fields=['event', 'role']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.get_role_display()} ({self.event.name})"
    
    @property
    def is_official(self):
        """Check if member is an official (Chairman, Secretary, Treasurer, or Event Owner)"""
        return self.role in ['CHAIRMAN', 'SECRETARY', 'TREASURER', 'EVENT_OWNER'] or self.user.role == 'ADMIN'
    
    @property
    def is_executive(self):
        """Check if member is an executive committee member"""
        return self.role in ['CHAIRMAN', 'SECRETARY', 'TREASURER', 'EVENT_OWNER'] or self.user.role == 'ADMIN'
    
    @property
    def has_super_admin_rights(self):
        """Event owners have super admin rights"""
        return self.role == 'EVENT_OWNER' or self.user.role == 'ADMIN'
    
    @property
    def can_approve_expenses(self):
        """Can this member approve expenses?"""
        return self.role in ['CHAIRMAN', 'TREASURER'] or self.user.role == 'ADMIN'
    
    @property
    def can_manage_roles(self):
        """Can this member manage other members' roles and assignments?"""
        # Only admins (via user.role) and executive members can manage roles
        return self.is_executive or self.user.role == 'ADMIN'
    
    @property
    def can_create_tasks(self):
        """Can this member create tasks?"""
        return self.role in ['CHAIRMAN', 'SECRETARY', 'EVENT_OWNER', 'TEAM_LEAD'] or self.user.role == 'ADMIN'


class ClusterGroup(models.Model):
    """Fund mobilization cluster groups"""
    
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='clusters'
    )
    funds_mobilization_committee = models.ForeignKey(
        'committees.Committee',
        on_delete=models.CASCADE,
        related_name='clusters',
        help_text="The Funds Mobilization Committee managing this cluster"
    )
    name = models.CharField(
        max_length=255,
        help_text="e.g., 'Family Members', 'Workmates', 'Church Group'"
    )
    cluster_lead = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_clusters'
    )
    
    # Financial targets and tracking
    target_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Target amount to collect from this cluster"
    )
    collected_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total amount collected so far"
    )
    pledged_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total amount pledged but not yet paid"
    )
    
    # Fund management
    funds_in_lead_account = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Funds currently with the cluster leader"
    )
    submitted_to_treasurer = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total amount deposited to treasurer"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['event', 'name']
        unique_together = [['event', 'name']]
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['cluster_lead']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.event.name}"
    
    @property
    def balance(self):
        """Remaining amount to reach target"""
        return self.target_amount - self.collected_amount
    
    @property
    def progress_percentage(self):
        """Progress towards target as percentage"""
        if self.target_amount > 0:
            return (self.collected_amount / self.target_amount) * 100
        return Decimal('0.00')
    
    @property
    def pending_in_lead_account(self):
        """Funds with leader not yet submitted to treasurer"""
        total_collected = self.contributions.filter(
            is_pledge=False
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

        total_submitted_any = self.deposits.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')

        pending = total_collected - total_submitted_any
        return pending if pending > 0 else Decimal('0.00')
    
    def update_collected_amount(self):
        """Recalculate collected amount from contributions"""
        total = self.contributions.filter(
            is_pledge=False
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        
        self.collected_amount = total
        self.save(update_fields=['collected_amount'])
    
    def update_pledged_amount(self):
        """Recalculate pledged amount from unfulfilled pledges"""
        total = self.contributions.filter(
            is_pledge=True,
            pledge_fulfilled=False
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        
        self.pledged_amount = total
        self.save(update_fields=['pledged_amount'])
    
    def update_submitted_amount(self):
        """Recalculate submitted amount from confirmed deposits"""
        total = self.deposits.filter(
            confirmed_by_treasurer=True
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        
        self.submitted_to_treasurer = total
        self.save(update_fields=['submitted_to_treasurer'])


class ClusterContribution(models.Model):
    """Individual contributions within a cluster"""
    
    PAYMENT_CHANNEL_CHOICES = [
        ('CASH', 'Cash'),
        ('MPESA', 'M-Pesa'),
        ('BANK', 'Bank Transfer'),
        ('CHEQUE', 'Cheque'),
        ('OTHER', 'Other'),
    ]
    
    cluster = models.ForeignKey(
        ClusterGroup,
        on_delete=models.CASCADE,
        related_name='contributions'
    )
    contributor_name = models.CharField(max_length=255)
    contributor_phone = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Pledge tracking
    is_pledge = models.BooleanField(
        default=False,
        help_text="Is this a pledge (not yet paid)?"
    )
    pledge_fulfilled = models.BooleanField(
        default=False,
        help_text="Has this pledge been fulfilled?"
    )
    pledge_fulfillment_date = models.DateTimeField(null=True, blank=True)
    
    # Payment details
    payment_channel = models.CharField(
        max_length=20,
        choices=PAYMENT_CHANNEL_CHOICES,
        default='CASH'
    )
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        help_text="M-Pesa code, cheque number, etc."
    )
    
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='cluster_contributions_recorded'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['cluster', '-created_at']),
            models.Index(fields=['is_pledge', 'pledge_fulfilled']),
            models.Index(fields=['payment_channel']),
        ]
    
    def __str__(self):
        status = "Pledge" if self.is_pledge else "Paid"
        return f"{self.contributor_name} - KES {self.amount} ({status})"
    
    def fulfill_pledge(self, payment_channel, reference_number=''):
        """Mark pledge as fulfilled"""
        if self.is_pledge and not self.pledge_fulfilled:
            self.pledge_fulfilled = True
            self.pledge_fulfillment_date = timezone.now()
            self.payment_channel = payment_channel
            self.reference_number = reference_number
            self.is_pledge = False  # Convert to actual payment
            self.save()
            
            # Update cluster amounts
            self.cluster.update_collected_amount()
            self.cluster.update_pledged_amount()
            return True
        return False


class ClusterDeposit(models.Model):
    """Deposits from cluster leads to treasurer"""
    
    DEPOSIT_CHANNEL_CHOICES = [
        ('CASH', 'Cash'),
        ('MPESA', 'M-Pesa'),
        ('BANK', 'Bank Transfer'),
        ('CHEQUE', 'Cheque'),
        ('OTHER', 'Other'),
    ]
    
    cluster = models.ForeignKey(
        ClusterGroup,
        on_delete=models.CASCADE,
        related_name='deposits'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    deposited_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='cluster_deposits_made'
    )
    
    # Payment details
    deposit_channel = models.CharField(
        max_length=20,
        choices=DEPOSIT_CHANNEL_CHOICES,
        default='MPESA'
    )
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        help_text="Transaction reference number"
    )
    
    # Treasurer confirmation
    confirmed_by_treasurer = models.BooleanField(
        default=False,
        help_text="Has the treasurer confirmed receipt?"
    )
    confirmed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cluster_deposits_confirmed'
    )
    treasurer_confirmation_date = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['cluster', '-created_at']),
            models.Index(fields=['confirmed_by_treasurer']),
            models.Index(fields=['deposited_by']),
        ]
    
    def __str__(self):
        status = "Confirmed" if self.confirmed_by_treasurer else "Pending"
        return f"{self.cluster.name} - KES {self.amount} ({status})"
    
    def confirm_by_treasurer(self, treasurer_user):
        """Treasurer confirms receipt of deposit"""
        if not self.confirmed_by_treasurer:
            self.confirmed_by_treasurer = True
            self.confirmed_by = treasurer_user
            self.treasurer_confirmation_date = timezone.now()
            self.save()
            
            # Update cluster submitted amount
            self.cluster.update_submitted_amount()
            
            # Update event total collected
            event = self.cluster.event
            event.total_collected += self.amount
            event.save(update_fields=['total_collected'])
            event.update_financial_progress()
            
            return True
        return False


class BudgetItem(models.Model):
    """Budget items for event planning and allocation"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    ]
    
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='budget_items',
        help_text="Event this budget item belongs to"
    )
    committee = models.ForeignKey(
        'committees.Committee',
        on_delete=models.CASCADE,
        related_name='budget_items',
        null=True,
        blank=True,
        help_text="Optional: Committee responsible for this budget item"
    )
    linked_task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        related_name='budget_items',
        null=True,
        blank=True,
        help_text="Task this budget line was generated from"
    )
    item_name = models.CharField(
        max_length=255,
        help_text="e.g., 'Catering Services', 'Transport Logistics'"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of the budget item"
    )
    category = models.CharField(
        max_length=100,
        default='OTHER',
        help_text="Budget category (e.g., CATERING, TRANSPORT, VENUE)"
    )
    allocated_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Approved/allocated budget amount"
    )
    spent_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Amount spent so far (from linked expenses)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        help_text="Approval status"
    )
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='budget_items_created',
        help_text="User who created this budget item"
    )
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='budget_items_approved',
        help_text="User who approved this budget item"
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this budget item was approved"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event', 'status']),
            models.Index(fields=['committee']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.item_name} - KES {self.allocated_amount} ({self.get_status_display()})"
    
    @property
    def remaining_balance(self):
        """Calculate remaining budget balance"""
        return self.allocated_amount - self.spent_amount
    
    @property
    def utilization_percentage(self):
        """Calculate budget utilization percentage"""
        if self.allocated_amount > 0:
            return (self.spent_amount / self.allocated_amount) * 100
        return Decimal('0.00')
    
    @property
    def is_over_budget(self):
        """Check if spending exceeds allocated amount"""
        return self.spent_amount > self.allocated_amount
    
    def update_spent_amount(self):
        """
        Recalculate spent amount from related expenses
        This will be called when expenses are linked to budget items
        """
        from apps.finance.models import Expense
        
        # Sum all approved/paid expenses linked to this budget item
        total = Expense.objects.filter(
            budget_item=self,
            status__in=['APPROVED', 'PAID']
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        
        self.spent_amount = total
        self.save(update_fields=['spent_amount'])
        
        # Update event total budget
        event = self.event
        event.total_budget = event.budget_items.filter(
            status='APPROVED'
        ).aggregate(
            total=models.Sum('allocated_amount')
        )['total'] or Decimal('0.00')
        
        event.total_spent = event.budget_items.aggregate(
            total=models.Sum('spent_amount')
        )['total'] or Decimal('0.00')
        
        event.save(update_fields=['total_budget', 'total_spent'])
        event.update_financial_progress()
    
    def approve(self, approver_user):
        """Approve budget item"""
        if self.status != 'APPROVED':
            self.status = 'APPROVED'
            self.approved_by = approver_user
            self.approved_at = timezone.now()
            self.save()
            
            # Update event total budget
            self.update_spent_amount()
            return True
        return False
    
    def reject(self, rejector_user):
        """Reject budget item"""
        if self.status == 'PENDING':
            self.status = 'REJECTED'
            self.approved_by = rejector_user
            self.approved_at = timezone.now()
            self.save()
            return True
        return False
    
    def mark_completed(self):
        """Mark budget item as completed"""
        if self.status == 'APPROVED':
            self.status = 'COMPLETED'
            self.save()
            return True
        return False


class BudgetAdjustmentRequest(models.Model):
    """Requests for adjusting budget item allocations"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    ADJUSTMENT_TYPE_CHOICES = [
        ('INCREASE', 'Increase Allocation'),
        ('DECREASE', 'Decrease Allocation'),
        ('REALLOCATION', 'Reallocation to Another Item'),
    ]
    
    budget_item = models.ForeignKey(
        BudgetItem,
        on_delete=models.CASCADE,
        related_name='adjustment_requests',
        help_text="Budget item to be adjusted"
    )
    adjustment_type = models.CharField(
        max_length=20,
        choices=ADJUSTMENT_TYPE_CHOICES,
        default='INCREASE'
    )
    original_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Current allocated amount"
    )
    requested_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="New requested amount"
    )
    adjustment_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Difference (positive or negative)"
    )
    reason = models.TextField(
        help_text="Justification for the adjustment"
    )
    supporting_documents = models.FileField(
        upload_to='budget_adjustments/',
        blank=True,
        null=True,
        help_text="Optional supporting documents (quotes, receipts)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    requested_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='budget_adjustments_requested'
    )
    reviewed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='budget_adjustments_reviewed'
    )
    review_notes = models.TextField(
        blank=True,
        help_text="Notes from reviewer (approval/rejection reason)"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['budget_item', 'status']),
            models.Index(fields=['requested_by']),
        ]
    
    def __str__(self):
        sign = '+' if self.adjustment_amount > 0 else ''
        return f"{self.budget_item.item_name} - {sign}KES {self.adjustment_amount} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        """Calculate adjustment amount before saving"""
        self.adjustment_amount = self.requested_amount - self.original_amount
        super().save(*args, **kwargs)
    
    def approve(self, reviewer_user):
        """Approve adjustment and update budget item"""
        if self.status == 'PENDING':
            self.status = 'APPROVED'
            self.reviewed_by = reviewer_user
            self.reviewed_at = timezone.now()
            self.save()
            
            # Update budget item allocated amount
            budget_item = self.budget_item
            budget_item.allocated_amount = self.requested_amount
            budget_item.save(update_fields=['allocated_amount'])
            
            # Trigger event budget recalculation
            budget_item.update_spent_amount()
            
            return True
        return False
    
    def reject(self, reviewer_user, notes=''):
        """Reject adjustment request"""
        if self.status == 'PENDING':
            self.status = 'REJECTED'
            self.reviewed_by = reviewer_user
            self.reviewed_at = timezone.now()
            self.review_notes = notes
            self.save()
            return True
        return False


class EventSchedule(models.Model):
    """Sub-events and scheduled activities within the main event"""
    
    SCHEDULE_TYPE_CHOICES = [
        ('SUB_EVENT', 'Sub Event'),
        ('MEETING', 'Meeting'),
        ('ANNOUNCEMENT', 'Announcement'),
        ('PROGRAM_ITEM', 'Program Item'),
        ('DEADLINE', 'Deadline'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    ]
    
    event = models.ForeignKey(
        'Event',
        on_delete=models.CASCADE,
        related_name='schedules',
        help_text="Main event this schedule belongs to"
    )
    title = models.CharField(
        max_length=255,
        help_text="e.g., 'Memorial Service', 'Budget Meeting'"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of the schedule item"
    )
    schedule_type = models.CharField(
        max_length=20,
        choices=SCHEDULE_TYPE_CHOICES,
        default='PROGRAM_ITEM'
    )
    start_datetime = models.DateTimeField(help_text="When the event/activity starts")
    end_datetime = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the event/activity ends (optional)"
    )
    location = models.CharField(
        max_length=255,
        blank=True,
        help_text="Physical or virtual location (e.g., 'Zoom link')"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Whether this appears in public program/announcements"
    )
    committee = models.ForeignKey(
        'committees.Committee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scheduled_items',
        help_text="Subcommittee responsible for this schedule item"
    )
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='schedules_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['event', 'start_datetime']),
            models.Index(fields=['status', 'is_public']),
            models.Index(fields=['committee']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.start_datetime.strftime('%Y-%m-%d %H:%M')})"
    
    def publish(self):
        """Publish this schedule item to make it public"""
        self.status = 'PUBLISHED'
        self.is_public = True
        self.save(update_fields=['status', 'is_public'])
        return True
    
    def cancel(self):
        """Cancel this schedule item"""
        self.status = 'CANCELLED'
        self.save(update_fields=['status'])
        return True
    
    def mark_completed(self):
        """Mark this schedule item as completed"""
        self.status = 'COMPLETED'
        self.save(update_fields=['status'])
        return True


class AuditLog(models.Model):
    """Track all changes to critical models for audit trail"""
    
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('APPROVE', 'Approved'),
        ('REJECT', 'Rejected'),
        ('OTHER', 'Other Action'),
    ]
    
    event = models.ForeignKey(
        'Event',
        on_delete=models.CASCADE,
        related_name='audit_logs',
        help_text="Event this audit log belongs to"
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        help_text="User who performed the action"
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Type of action performed"
    )
    model_name = models.CharField(
        max_length=100,
        help_text="Model/table that was modified (e.g., 'BudgetItem')"
    )
    object_id = models.PositiveIntegerField(
        help_text="ID of the object that was modified"
    )
    object_repr = models.CharField(
        max_length=255,
        help_text="String representation of the object"
    )
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text="Dictionary of field changes: {'field': {'old': value, 'new': value}}"
    )
    description = models.TextField(
        blank=True,
        help_text="Human-readable description of the action"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the user"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} {self.action} {self.model_name}#{self.object_id} at {self.timestamp}"


class Notification(models.Model):
    """SMS/Email notification queue and tracking"""
    
    NOTIFICATION_TYPE_CHOICES = [
        ('APPROVAL_PENDING', 'Approval Pending'),
        ('DEPOSIT_CONFIRMED', 'Deposit Confirmed'),
        ('DEADLINE_APPROACHING', 'Deadline Approaching'),
        ('TASK_ASSIGNED', 'Task Assigned'),
        ('BUDGET_ADJUSTED', 'Budget Adjusted'),
        ('MEETING_REMINDER', 'Meeting Reminder'),
        ('SCHEDULE_PUBLISHED', 'Schedule Published'),
        ('PAYMENT_APPROVED', 'Payment Approved'),
        ('OTHER', 'Other'),
    ]
    
    CHANNEL_CHOICES = [
        ('SMS', 'SMS'),
        ('EMAIL', 'Email'),
        ('BOTH', 'SMS and Email'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    event = models.ForeignKey(
        'Event',
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text="Event this notification belongs to"
    )
    recipient = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='notifications_received',
        help_text="User receiving the notification"
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPE_CHOICES,
        help_text="Category/type of notification"
    )
    channel = models.CharField(
        max_length=10,
        choices=CHANNEL_CHOICES,
        default='SMS',
        help_text="Delivery channel (SMS, Email, or Both)"
    )
    subject = models.CharField(
        max_length=255,
        help_text="Email subject or SMS preview"
    )
    message = models.TextField(
        help_text="Full notification message body"
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text="Recipient phone number for SMS"
    )
    email_address = models.EmailField(
        blank=True,
        help_text="Recipient email address"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the notification was successfully sent"
    )
    error_message = models.TextField(
        blank=True,
        help_text="Error details if sending failed"
    )
    related_object_model = models.CharField(
        max_length=100,
        blank=True,
        help_text="Model name of related object (e.g., 'BudgetItem')"
    )
    related_object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="ID of related object"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event', 'status']),
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"{self.notification_type} to {self.recipient} via {self.channel} ({self.status})"
    
    def mark_sent(self):
        """Mark notification as successfully sent"""
        self.status = 'SENT'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])
        return True
    
    def mark_failed(self, error_msg=''):
        """Mark notification as failed with error message"""
        self.status = 'FAILED'
        self.error_message = error_msg
        self.save(update_fields=['status', 'error_message'])
        return True
    
    def cancel(self):
        """Cancel pending notification"""
        if self.status == 'PENDING':
            self.status = 'CANCELLED'
            self.save(update_fields=['status'])
            return True
        return False
