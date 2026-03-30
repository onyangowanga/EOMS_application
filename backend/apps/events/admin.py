from django.contrib import admin
from .models import (
    Event, EventMember, ClusterGroup, ClusterContribution, ClusterDeposit,
    BudgetItem, BudgetAdjustmentRequest, EventSchedule, AuditLog, Notification
)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['name', 'event_type', 'event_date', 'status', 'days_until_event', 
                    'financial_progress', 'operational_progress']
    list_filter = ['event_type', 'status', 'event_date']
    search_fields = ['name', 'location', 'description']
    readonly_fields = ['created_at', 'updated_at', 'days_until_event', 'financial_balance', 
                      'overall_progress']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'event_type', 'event_date', 'location', 'description', 'status')
        }),
        ('Progress Tracking', {
            'fields': ('financial_progress', 'operational_progress', 'overall_progress')
        }),
        ('Financial Summary', {
            'fields': ('total_budget', 'total_collected', 'total_spent', 'financial_balance')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'days_until_event'),
            'classes': ('collapse',)
        }),
    )
    
    def days_until_event(self, obj):
        days = obj.days_until_event
        if days is not None:
            if days < 0:
                return f"{abs(days)} days ago"
            elif days == 0:
                return "Today!"
            else:
                return f"{days} days"
        return "-"
    days_until_event.short_description = "Days Until Event"


@admin.register(EventMember)
class EventMemberAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'event', 'role', 'phone', 'email', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active', 'event']
    search_fields = ['full_name', 'phone', 'email', 'event__name']
    readonly_fields = ['joined_at', 'updated_at', 'is_official', 'has_super_admin_rights']
    
    fieldsets = (
        ('Event & Role', {
            'fields': ('event', 'user', 'role', 'is_active')
        }),
        ('Contact Information', {
            'fields': ('full_name', 'phone', 'alternative_phone', 'email')
        }),
        ('Permissions', {
            'fields': ('is_official', 'has_super_admin_rights', 'can_approve_expenses'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('joined_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ClusterGroup)
class ClusterGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'event', 'cluster_lead', 'target_amount', 'collected_amount', 
                    'progress_percentage', 'balance', 'submitted_to_treasurer']
    list_filter = ['event', 'cluster_lead']
    search_fields = ['name', 'event__name', 'cluster_lead__full_name']
    readonly_fields = ['balance', 'progress_percentage', 'pending_in_lead_account', 
                      'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('event', 'funds_mobilization_committee', 'name', 'cluster_lead')
        }),
        ('Financial Targets', {
            'fields': ('target_amount', 'collected_amount', 'pledged_amount', 
                      'progress_percentage', 'balance')
        }),
        ('Fund Management', {
            'fields': ('funds_in_lead_account', 'submitted_to_treasurer', 'pending_in_lead_account')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def progress_percentage(self, obj):
        return f"{obj.progress_percentage:.1f}%"
    progress_percentage.short_description = "Progress"


@admin.register(ClusterContribution)
class ClusterContributionAdmin(admin.ModelAdmin):
    list_display = ['contributor_name', 'cluster', 'amount', 'payment_channel', 
                    'is_pledge', 'pledge_fulfilled', 'created_at']
    list_filter = ['cluster', 'is_pledge', 'pledge_fulfilled', 'payment_channel', 'created_at']
    search_fields = ['contributor_name', 'contributor_phone', 'reference_number', 
                    'cluster__name']
    readonly_fields = ['created_at', 'updated_at', 'pledge_fulfillment_date']
    
    fieldsets = (
        ('Contribution Details', {
            'fields': ('cluster', 'contributor_name', 'contributor_phone', 'amount')
        }),
        ('Pledge Information', {
            'fields': ('is_pledge', 'pledge_fulfilled', 'pledge_fulfillment_date')
        }),
        ('Payment Details', {
            'fields': ('payment_channel', 'reference_number', 'notes')
        }),
        ('Recording Information', {
            'fields': ('recorded_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ClusterDeposit)
class ClusterDepositAdmin(admin.ModelAdmin):
    list_display = ['cluster', 'amount', 'deposit_channel', 'deposited_by', 
                    'confirmed_by_treasurer', 'confirmed_by', 'created_at']
    list_filter = ['cluster', 'confirmed_by_treasurer', 'deposit_channel', 'created_at']
    search_fields = ['cluster__name', 'reference_number', 'deposited_by__full_name']
    readonly_fields = ['created_at', 'updated_at', 'treasurer_confirmation_date']
    
    fieldsets = (
        ('Deposit Details', {
            'fields': ('cluster', 'amount', 'deposited_by')
        }),
        ('Payment Information', {
            'fields': ('deposit_channel', 'reference_number', 'notes')
        }),
        ('Treasurer Confirmation', {
            'fields': ('confirmed_by_treasurer', 'confirmed_by', 'treasurer_confirmation_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BudgetItem)
class BudgetItemAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'event', 'committee', 'allocated_amount', 'spent_amount', 
                    'utilization_display', 'remaining_balance', 'status', 'created_at']
    list_filter = ['event', 'committee', 'status', 'category', 'created_at']
    search_fields = ['item_name', 'description', 'event__name', 'committee__name']
    readonly_fields = ['created_at', 'updated_at', 'spent_amount', 'utilization_percentage', 
                       'remaining_balance', 'is_over_budget']
    
    fieldsets = (
        ('Budget Item Details', {
            'fields': ('event', 'committee', 'item_name', 'description', 'category')
        }),
        ('Budget Allocation', {
            'fields': ('allocated_amount', 'spent_amount', 'remaining_balance', 
                       'utilization_percentage', 'is_over_budget')
        }),
        ('Approval Status', {
            'fields': ('status', 'created_by', 'approved_by', 'approved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def utilization_display(self, obj):
        """Display utilization percentage"""
        percentage = obj.utilization_percentage
        if percentage > 100:
            return f"⚠️ {percentage:.1f}% (Over Budget!)"
        elif percentage > 80:
            return f"🟡 {percentage:.1f}% (Warning)"
        else:
            return f"🟢 {percentage:.1f}%"
    utilization_display.short_description = 'Utilization'


@admin.register(BudgetAdjustmentRequest)
class BudgetAdjustmentRequestAdmin(admin.ModelAdmin):
    list_display = ['budget_item', 'adjustment_type', 'adjustment_display', 'status', 
                    'requested_by', 'reviewed_by', 'created_at']
    list_filter = ['status', 'adjustment_type', 'created_at', 'reviewed_at']
    search_fields = ['budget_item__item_name', 'reason', 'requested_by__full_name']
    readonly_fields = ['created_at', 'updated_at', 'adjustment_amount', 'reviewed_at']
    
    fieldsets = (
        ('Budget Item', {
            'fields': ('budget_item',)
        }),
        ('Adjustment Request', {
            'fields': ('adjustment_type', 'original_amount', 'requested_amount', 
                       'adjustment_amount', 'reason', 'supporting_documents')
        }),
        ('Review Status', {
            'fields': ('status', 'requested_by', 'reviewed_by', 'review_notes', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def adjustment_display(self, obj):
        """Display adjustment amount with sign and color"""
        amount = obj.adjustment_amount
        if amount > 0:
            return f"🔼 +KES {amount:,.2f}"
        elif amount < 0:
            return f"🔽 KES {amount:,.2f}"
        else:
            return "➖ KES 0.00"
    adjustment_display.short_description = 'Adjustment'


@admin.register(EventSchedule)
class EventScheduleAdmin(admin.ModelAdmin):
    list_display = ['title', 'event', 'schedule_type', 'start_datetime', 'status', 
                    'is_public', 'location', 'created_by']
    list_filter = ['schedule_type', 'status', 'is_public', 'start_datetime', 'event']
    search_fields = ['title', 'description', 'location', 'event__name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'start_datetime'
    
    fieldsets = (
        ('Schedule Information', {
            'fields': ('event', 'title', 'description', 'schedule_type')
        }),
        ('Date & Time', {
            'fields': ('start_datetime', 'end_datetime', 'location')
        }),
        ('Status & Visibility', {
            'fields': ('status', 'is_public', 'committee')
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['publish_schedules', 'cancel_schedules']
    
    def publish_schedules(self, request, queryset):
        updated = 0
        for schedule in queryset:
            if schedule.publish():
                updated += 1
        self.message_user(request, f"{updated} schedule(s) published successfully.")
    publish_schedules.short_description = "Publish selected schedules"
    
    def cancel_schedules(self, request, queryset):
        updated = 0
        for schedule in queryset:
            if schedule.cancel():
                updated += 1
        self.message_user(request, f"{updated} schedule(s) cancelled.")
    cancel_schedules.short_description = "Cancel selected schedules"


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'action', 'model_name', 'object_repr', 
                    'event', 'ip_address']
    list_filter = ['action', 'model_name', 'timestamp', 'event']
    search_fields = ['user__full_name', 'model_name', 'object_repr', 'description']
    readonly_fields = ['event', 'user', 'action', 'model_name', 'object_id', 
                      'object_repr', 'changes', 'description', 'ip_address', 'timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Action Details', {
            'fields': ('timestamp', 'user', 'action', 'ip_address')
        }),
        ('Target Object', {
            'fields': ('event', 'model_name', 'object_id', 'object_repr')
        }),
        ('Changes', {
            'fields': ('changes', 'description'),
            'classes': ('wide',)
        }),
    )
    
    def has_add_permission(self, request):
        """Audit logs are created automatically, not manually"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Audit logs should not be deleted (audit trail integrity)"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Audit logs should not be modified"""
        return False


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['subject', 'recipient', 'notification_type', 'channel', 
                    'status', 'created_at', 'sent_at']
    list_filter = ['notification_type', 'channel', 'status', 'created_at', 'event']
    search_fields = ['subject', 'message', 'recipient__full_name', 'phone_number', 'email_address']
    readonly_fields = ['created_at', 'updated_at', 'sent_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Recipient', {
            'fields': ('event', 'recipient', 'phone_number', 'email_address')
        }),
        ('Notification Details', {
            'fields': ('notification_type', 'channel', 'subject', 'message')
        }),
        ('Related Object', {
            'fields': ('related_object_model', 'related_object_id'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('status', 'sent_at', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['resend_notifications', 'cancel_notifications']
    
    def resend_notifications(self, request, queryset):
        """Reset failed/cancelled notifications to pending for retry"""
        updated = queryset.filter(status__in=['FAILED', 'CANCELLED']).update(
            status='PENDING',
            error_message=''
        )
        self.message_user(request, f"{updated} notification(s) queued for resending.")
    resend_notifications.short_description = "Resend selected notifications"
    
    def cancel_notifications(self, request, queryset):
        """Cancel pending notifications"""
        updated = 0
        for notification in queryset:
            if notification.cancel():
                updated += 1
        self.message_user(request, f"{updated} notification(s) cancelled.")
    cancel_notifications.short_description = "Cancel selected notifications"
