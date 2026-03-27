# EOMS Restructuring Plan: Event-Centric Architecture

**Date**: March 27, 2026  
**Status**: 📋 Planning Phase  
**Priority**: HIGH - Major Architectural Refactor

---

## 🎯 Executive Summary

Complete restructuring from **committee-centric** to **event-centric** architecture with cluster-based fund mobilization, advanced budget tracking, and progress monitoring.

### Key Changes
1. **One Event per Instance** - Main event with umbrella committee
2. **Cluster-based Fund Mobilization** - Groups with targets and daily tracking
3. **Subcommittee Structure** - Multiple subcommittees under main event
4. **Advanced Budget System** - Auto-logging, allocation, approval workflows
5. **Progress Tracking** - Percentage-based with Financial/Operations grouping

---

## 📊 Current vs Proposed Architecture

### Current (Committee-Centric)
```
Multiple Committees (Independent)
├── Committee 1
│   ├── Members
│   ├── Tasks
│   ├── Finances
│   └── Providers
├── Committee 2
└── Committee 3
```

### Proposed (Event-Centric)
```
ONE EVENT (Funeral/Wedding/Corporate)
├── Main/Umbrella Committee
│   ├── Chairman
│   ├── Secretary
│   ├── Treasurer
│   ├── Event Owners (Bereaved/Bride&Groom)
│   └── Committee Members
├── Subcommittees
│   ├── Budget & Finance Committee (Special)
│   ├── Funds Mobilization Committee (Special)
│   │   ├── Cluster Groups
│   │   │   ├── Cluster 1 (Target, Collected, Pledges, Balance)
│   │   │   ├── Cluster 2
│   │   │   └── Cluster N
│   │   └── Cluster Leaders (Report daily, Deposit to Treasurer)
│   ├── Logistics Committee
│   ├── Catering Committee
│   └── Other Subcommittees
├── Budget Management
│   ├── Budget Items
│   ├── Allocations to Subcommittees
│   ├── Auto-logged Activities (Pending Approval)
│   └── Approval Workflow
├── Treasury
│   ├── Payments Received (Mapped to Cluster/General)
│   ├── Fund Requisitions
│   ├── Approval (Chair + Treasurer + 1 Finance Member)
│   └── Payment Recording
└── Progress Tracking
    ├── Financial Progress (%)
    ├── Operational Progress (%)
    └── Overall Progress
```

---

## 🏗️ Database Schema Changes

### 1. New: Event Model
```python
class Event(models.Model):
    """Main event entity"""
    name = models.CharField(max_length=255)  # e.g., "John Doe Funeral"
    event_type = models.CharField(choices=[
        ('FUNERAL', 'Funeral'),
        ('WEDDING', 'Wedding'),
        ('CORPORATE', 'Corporate Event'),
        ('OTHER', 'Other')
    ])
    event_date = models.DateField()
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(choices=[
        ('PLANNING', 'Planning'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Progress tracking
    financial_progress = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # %
    operational_progress = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # %
```

### 2. Modified: Committee Model (Now Subcommittee)
```python
class Committee(models.Model):
    """Subcommittee under main event"""
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='subcommittees')
    name = models.CharField(max_length=255)
    is_main = models.BooleanField(default=False)  # Main/Umbrella committee
    committee_type = models.CharField(choices=[
        ('MAIN', 'Main Committee'),
        ('BUDGET_FINANCE', 'Budget & Finance Committee'),
        ('FUNDS_MOBILIZATION', 'Funds Mobilization Committee'),
        ('LOGISTICS', 'Logistics'),
        ('CATERING', 'Catering'),
        ('VENUE', 'Venue'),
        ('TRANSPORT', 'Transport'),
        ('OTHER', 'Other')
    ])
    description = models.TextField(blank=True)
    lead = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='led_committees')
    expected_activities = models.TextField(blank=True)
    deadline = models.DateField(null=True, blank=True)
    budget_allocation = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 3. New: EventMember Model (Main Committee)
```python
class EventMember(models.Model):
    """Members of the main event committee"""
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    role = models.CharField(choices=[
        ('CHAIRMAN', 'Chairman'),
        ('SECRETARY', 'Secretary'),
        ('TREASURER', 'Treasurer'),
        ('EVENT_OWNER', 'Event Owner'),  # Bereaved, Bride, Groom, etc.
        ('MEMBER', 'Committee Member')
    ])
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    alternative_phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
```

### 4. New: ClusterGroup Model
```python
class ClusterGroup(models.Model):
    """Fund mobilization cluster groups"""
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='clusters')
    funds_mobilization_committee = models.ForeignKey('Committee', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)  # e.g., "Family Members", "Workmates", "Church Group"
    cluster_lead = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    collected_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pledged_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Auto-calculated
    funds_in_lead_account = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    submitted_to_treasurer = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def progress_percentage(self):
        if self.target_amount > 0:
            return (self.collected_amount / self.target_amount) * 100
        return 0
```

### 5. New: ClusterContribution Model
```python
class ClusterContribution(models.Model):
    """Individual contributions within a cluster"""
    cluster = models.ForeignKey('ClusterGroup', on_delete=models.CASCADE, related_name='contributions')
    contributor_name = models.CharField(max_length=255)
    contributor_phone = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_pledge = models.BooleanField(default=False)
    pledge_fulfilled = models.BooleanField(default=False)
    payment_channel = models.CharField(choices=[
        ('CASH', 'Cash'),
        ('MPESA', 'M-Pesa'),
        ('BANK', 'Bank Transfer'),
        ('OTHER', 'Other')
    ])
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 6. New: ClusterDeposit Model
```python
class ClusterDeposit(models.Model):
    """Deposits from cluster leads to treasurer"""
    cluster = models.ForeignKey('ClusterGroup', on_delete=models.CASCADE, related_name='deposits')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    deposited_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='cluster_deposits')
    deposit_channel = models.CharField(max_length=50)  # MPESA, Bank, Cash
    reference_number = models.CharField(max_length=100, blank=True)
    confirmed_by_treasurer = models.BooleanField(default=False)
    treasurer_confirmation_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 7. New: BudgetItem Model
```python
class BudgetItem(models.Model):
    """Budget items for the event"""
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='budget_items')
    committee = models.ForeignKey('Committee', on_delete=models.CASCADE, related_name='budget_items', null=True, blank=True)
    item_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    allocated_amount = models.DecimalField(max_digits=12, decimal_places=2)
    spent_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(choices=[
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed')
    ], default='PENDING')
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='budget_items_created')
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='budget_items_approved')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 8. Modified: Expense Model
```python
class Expense(models.Model):
    """Expenses/Requisitions"""
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='expenses')
    committee = models.ForeignKey('Committee', on_delete=models.CASCADE)
    budget_item = models.ForeignKey('BudgetItem', on_delete=models.SET_NULL, null=True, blank=True)
    vendor = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=100)
    description = models.TextField()
    receipt_url = models.URLField(blank=True)
    status = models.CharField(choices=[
        ('PENDING', 'Pending'),
        ('APPROVED_CHAIR', 'Approved by Chair'),
        ('APPROVED_TREASURER', 'Approved by Treasurer'),
        ('APPROVED_FINANCE', 'Approved by Finance Member'),
        ('FULLY_APPROVED', 'Fully Approved'),
        ('PAID', 'Paid'),
        ('REJECTED', 'Rejected')
    ])
    requested_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='expenses_requested')
    approved_by_chair = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses_approved_chair')
    approved_by_treasurer = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses_approved_treasurer')
    approved_by_finance = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses_approved_finance')
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 9. Modified: Collection Model
```python
class Collection(models.Model):
    """Treasury collections"""
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='collections')
    cluster = models.ForeignKey('ClusterGroup', on_delete=models.SET_NULL, null=True, blank=True)  # If from cluster
    source_type = models.CharField(choices=[
        ('CLUSTER', 'Cluster Group'),
        ('GENERAL', 'General/Direct')
    ])
    payer_name = models.CharField(max_length=255)
    payer_phone = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    channel = models.CharField(max_length=50)
    reference_number = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    recorded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 10. Modified: Task Model
```python
class Task(models.Model):
    """Tasks with progress tracking"""
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='tasks')
    committee = models.ForeignKey('Committee', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    assigned_to = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(choices=[...])
    priority = models.CharField(choices=[...])
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # NEW
    deadline = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='tasks_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 11. New: EventSchedule Model
```python
class EventSchedule(models.Model):
    """Sub-events and scheduled activities"""
    event = models.ForeignKey('Event', on_delet ✨ ENHANCED
**URL**: `/event/dashboard`

**Sections**:
```
┌─────────────────────────────────────────────────────────────────┐
│  🎗️ EVENT: John Doe Funeral - Celebrating a Life Well Lived    │
│  📅 Main Event: April 15, 2026 (10 days remaining) ⏰           │
│  Status: Active  |  Location: St. Mary's Cathedral              │
├─────────────────────────────────────────────────────────────────┤
│  📊 FINANCIAL SUMMARY                                           │
│  ┌─────────────────────┬─────────────────────┐                 │
│  │ COLLECTIONS         │ BUDGET              │                 │
│  │ Target: 2,000,000   │ Total: 2,000,000    │                 │
│  │ Collected: 1,600,000│ Spent: 400,000      │                 │
│  │ Balance: 400,000    │ Available: 1,600,000│                 │
│  │ [████████░░] 80%    │ [██░░░░░░░░] 20%    │                 │
│  └─────────────────────┴─────────────────────┘                 │
├─────────────────────────────────────────────────────────────────┤
│  📈 OVERALL PROGRESS                                            │
│  ├─ Financial: [████████░░] 80% (KES 1.6M / 2M)                │
│  └─ Operational: [███████░░░] 70% (35/50 tasks completed)      │
├─────────────────────────────────────────────────────────────────┤
│  📅 UPCOMING EVENTS & MEETINGS                                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ TODAY - 2:00 PM: Budget Committee Meeting (Zoom)    │       │
│  │ Mar 30 - 10:00 AM: Memorial Mass (St. Mary's)       │       │
│  │ Apr 10 - 6:00 AM: Traveling Home (Convoy departure) │       │
│  │ Apr 15 - 10:00 AM: Burial Ceremony (Home village)   │       │
│  │ [View Full Program]                                 │       │
│  └─────────────────────────────────────────────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  👥 MAIN COMMITTEE                                              │
│  ├─ Chairman: John Smith (+254712345678) [Super Admin]         │
│  ├─ Secretary: Jane Doe (+254723456789)                        │
│  ├─ Treasurer: Mary Johnson (+254734567890)                    │
│  └─ Event Owners: Sarah Doe, Peter Doe, Lucy Doe               │
├─────────────────────────────────────────────────────────────────┤
│  🏛️ SUBCOMMITTEES (6)                                           │
│  [+ Create Subcommittee]                                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │ 💰 Budget & Finance Committee                     │         │
│  │ Lead: Sarah Wilson                                │         │
│  │ Budget: KES 500,000  |  Spent: 320,000 (64%)      │         │
│  │ 📋 Pending: 12 activities, 3 adjustment requests  │         │
│  │ [Review Queue]                                    │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │ 🎯 Funds Mobilization Committee                   │         │
│  │ Lead: Peter Omondi                                │         │
│  │ Clusters: 8  |  Target: 2M  |  Collected: 1.6M   │         │
│  │ [████████░░] 80% complete                         │         │
│  │ 💵 Pending Deposits: 5 (KES 150,000)              │         │
│  │ [View Clusters] [Confirm Deposits]                │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │ 📺 Program, Eulogy & Media Committee              │         │
│  │ Lead: James Kamau                                 │         │
│  │ Budget: KES 200,000  |  Spent: 80,000 (40%)       │         │
│  │ 📅 Managing 4 sub-events in schedule              │         │
│  │ Tasks: 15 (10 completed) - 67%                    │         │
│  │ [View Program] [Edit Schedule]                    │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │ 🚚 Logistics Committee                            │         │
│  │ Lead: Alice Wanjiru                               │         │
│  │ Budget: KES 400,000  |  Spent: 150,000 (37.5%)    │         │
│  │ Tasks: 20 (12 completed) - 60%                    │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  [...other committees]                                          │
├─────────────────────────────────────────────────────────────────┤
│  🔔 NOTIFICATIONS & ALERTS (5)                                  │
│  • 3 requisitions pending your approval                        │
│  • 2 budget adjustment requests from Logistics                 │
│  • Memorial Mass program published                             │
│  [View All]                                                     │
└────────────           models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['model_name', 'object_id']),
        ]
```

### 13. New: BudgetAdjustmentRequest Model
```python
class BudgetAdjustmentRequest(models.Model):
    """Committee leads request budget adjustments"""
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='budget_adjustment_requests')
    committee = models.ForeignKey('Committee', on_delete=models.CASCADE)
    budget_item = models.ForeignKey('BudgetItem', on_delete=models.CASCADE)
    requested_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='budget_requests')
    current_allocation = models.DecimalField(max_digits=12, decimal_places=2)
    requested_allocation = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField()  # Why adjustment is needed
    justification = models.TextField(blank=True)  # Additional supporting details
    status = models.CharField(choices=[
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled')
    ], default='PENDING')
    reviewed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='budget_reviews')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 14. New: Notification Model
```python
class Notification(models.Model):
    """SMS/Email notification queue"""
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='notifications')
    recipient = models.ForeignKey('users.User', on_delete=models.CASCADE)
    notification_type = models.CharField(choices=[
        ('APPROVAL_PENDING', 'Approval Pending'),
        ('DEPOSIT_CONFIRMED', 'Deposit Confirmed'),
        ('DEADLINE_APPROACHING', 'Deadline Approaching'),
        ('TASK_ASSIGNED', 'Task Assigned'),
        ('BUDGET_ADJUSTED', 'Budget Adjusted'),
        ('MEETING_REMINDER', 'Meeting Reminder'),
        ('OTHER', 'Other')
    ])
    channel = models.CharField(choices=[
        ('SMS', 'SMS'),
        ('EMAIL', 'Email'),
        ('BOTH', 'SMS and Email')
    ])
    subject = models.CharField(max_length=255)
    message = models.TextField()
    phone_number = models.CharField(max_length=20, blank=True)
    email_address = models.EmailField(blank=True)
    status = models.CharField(choices=[
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled')
    ], default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 🎨 User Interface Changes

### 1. Event Dashboard (New - Main Entry Point)
**URL**: `/event/dashboard`

**Sections**:
```
┌─────────────────────────────────────────────────────┐
│  EVENT: John Doe Funeral                            │
│  Date: April 15, 2026  |  Status: Active            │
├─────────────────────────────────────────────────────┤
│  PROGRESS                                           │
│  ├─ Financial: [████████░░] 80%                     │
│  └─ Operational: [███████░░░] 70%                   │
├─────────────────────────────────────────────────────┤
│  MAIN COMMITTEE                                     │
│  ├─ Chairman: John Smith (+254712345678)            │
│  ├─ Secretary: Jane Doe (+254723456789)             │
│  ├─ Treasurer: Mary Johnson (+254734567890)         │
│  └─ Event Owners: 3 person(s)                       │
├─────────────────────────────────────────────────────┤
│  SUBCOMMITTEES (6)                                  │
│  [+ Create Subcommittee]                            │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Budget & Finance Committee              │       │
│  │ Lead: Sarah Wilson                      │       │
│  │ Budget: KES 500,000  |  Spent: 320,000  │       │
│  │ Activities: 12 pending approval         │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Funds Mobilization Committee            │       │
│  │ Lead: Peter Omondi                      │       │
│  │ Clusters: 8  |  Target: 2M  |  80% done │       │
│  │ [View Clusters]                         │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Logistics Committee                     │       │
│  │ Lead: James Kamau                       │       │
│  │ Tasks: 15 (10 completed)  |  67%        │       │
│  └─────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```Create EventSchedule model and migrations **NEW**
- [ ] Create AuditLog model and migrations **NEW**
- [ ] Create BudgetAdjustmentRequest model and migrations **NEW**
- [ ] Create Notification model and migrations **NEW**
- [ ] Modify Committee model (add event_id, is_main, committee_type)
- [ ] Modify Task model (add progress_percentage)
- [ ] Modify Expense model (add multi-approval fields)
- [ ] Modify Collection model (add source_type, cluster_id)
- [ ] Create Event serializers and viewsets
- [ ] Create Cluster serializers and viewsets
- [ ] Create Budget serializers and viewsets
- [ ] Create EventSchedule serializers and viewsets **NEW**
- [ ] Create AuditLog viewsets (read-only) **NEW**
- [ ] Create BudgetAdjustmentRequest serializers and viewsets **NEW**
- [ ] Create Notification management endpoints **NEW**
- [ ] Update existing serializers for event-scoping
- [ ] Implement progress calculation logic
- [ ] Implement approval workflow logic
- [ ] Implement audit logging middleware **NEW**
- [ ] Implement notification queue and sending (Celery tasks) **NEW**
- [ ] Integrate Africa's Talking SMS API **NEW**
- [ ] Create API endpoints for all new features
- [ ] Update permissions and access control
- [ ] Add cluster summary aggregation (read-only for other clusters) **NEW**
┌─────────────────────────────────────────────────────┐
│  FUND MOBILIZATION CLUSTERS                         │
├─────────────────────────────────────────────────────┤
│  Overall: KES 1,600,000 / 2,000,000 (80%)           │
│  [━━━━━━━━━━━━━━━━░░░░] 80%                         │
├─────────────────────────────────────────────────────┤
│  Cluster               Target    Collected  Pledges │
│  ─────────────────────────────────────────────────  │
│  Family Members        500K      450K       50K     │
│  [████████████████░░] 90%                           │
│  Rep: John Kamau  |  In Lead: 50K  |  Submitted: 400K│
│  [Log Contribution] [Deposit to Treasurer]          │
│  ────────────────────────────────────────────────   │
│  Workmates             300K      240K       30K     │
│  [████████████░░░░░] 80%                            │
│  Rep: Mary Wanjiku  |  In Lead: 20K  |  Submitted: 220K│
│  [Log Contribution] [Deposit to Treasurer]          │
│  ────────────────────────────────────────────────   │
│  Church Group          400K      350K       40K     │
│  [█████████████████░] 87%                           │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

### 3. Treasury Page (Redesigned)
**URL**: `/event/treasury`

**Tabs**:
- **Receipts**: All payments received (mapped to cluster or general)
- **Requisitions**: Fund requests with approval status
- **Deposits**: Cluster deposits pending confirmation

```
┌─────────────────────────────────────────────────────┐
│  TREASURY MANAGEMENT                                │
├─────────────────────────────────────────────────────┤
│  Balance: KES 1,200,000                             │
│  Collections: KES 1,600,000                         │
│  Paid Out: KES 400,000                              │
│  Pending Requisitions: 8 (KES 250,000)              │
├─────────────────────────────────────────────────────┤
│  [Receipts] [Requisitions] [Cluster Deposits]       │
│                                                     │
│  REQUISITIONS TAB:                                  │
│  ID   Committee      Amount    Status               │
│  001  Logistics      50,000    Chair ✓ Treasurer ✓ Finance [Approve]│
│  002  Catering       80,000    Chair ✓ Treasurer [Pending]│
│  003  Transport      30,000    Pending approval     │
│                                                     │
│  Click row to see details and approve/pay           │
└─────────────────────────────────────────────────────┘
```

### 4. Budget Management Page
**URL**: `/event/budget`

**Features**:
- Budget items list
- Allocation to committees
- Auto-logged activities pending approval
- Approval/rejection workflow

```
┌─────────────────────────────────────────────────────┐
│  BUDGET & FINANCE MANAGEMENT                        │
├─────────────────────────────────────────────────────┤
│  Total Budget: KES 2,000,000                        │
│  Allocated: KES 1,800,000  |  Spent: KES 400,000    │
│  [+ Create Budget Item]                             │
├─────────────────────────────────────────────────────┤
│  Item              Committee   Allocated  Spent     │
│  ────────────────────────────────────────────────   │
│  Venue Rental      Logistics   200,000    200,000   │
│  Food & Drinks     Catering    500,000    150,000   │
│  Transport         Transport   300,000    50,000    │
│  ...                                                │
├─────────────────────────────────────────────────────┤
│  PENDING APPROVAL (Auto-logged Activities):         │
│  12 activities need review                          │
│  [Review Queue]                                     │
└─────────────────────────────────────────────────────┘
```

### 5. Subcommittee Detail Page
**URL**: `/event/subcommittee/:id`

**Editable by**: Officials (Chair, Secretary, Treasurer) + Subcommittee Lead

**Sections**:
- Committee info (editable)
- Expected activities (editable)
- Deadline (editable)
- Budget allocation (editable by finance committee)
- Members list
- Tasks list with progress
- Budget items/expenses

---

## 🔄 Migration Strategy
 with enhanced features **UPDATED**
  - [ ] Budget summary widget
  - [ ] Collection summary widget
  - [ ] Countdown timer to main event
  - [ ] Upcoming events/meetings list
  - [ ] Quick notifications panel
- [ ] Create EventSetup wizard (create event + main committee)
- [ ] Create EventSchedule management page **NEW**
  - [ ] Create/edit sub-events
  - [ ] Program builder for each sub-event
  - [ ] Public announcement editor
  - [ ] Publish/unpublish controls
- [ ] Create ClusterManagement page
  - [ ] Add cluster summary view (read-only for other clusters) **NEW**
- [ ] Create ClusterContribution form (for cluster leaders)
- [ ] Create ClusterDeposit form (deposit to treasurer)
- [ ] Update Treasury page (3 tabs: Receipts, Requisitions, Deposits)
- [ ] Create BudgetManagement page
  - [ ] Add adjustment request workflow **NEW**
  - [ ] Approval/rejection interface
- [ ] Update Subcommittee pages (add edit permissions)
- [ ] Create AuditLog viewer page **NEW**
  - [ ] Filter by user, action, date range
  - [ ] Export audit reports
- [ ] Creatbudget adjustment request workflow **NEW**
- [ ] Test progress calculation
- [ ] Test role-based permissions (Event Owner super admin) **UPDATED**
- [ ] Test event schedule creation and management **NEW**
- [ ] Test audit log recording for all actions **NEW**
- [ ] Test notification sending (SMS + Email) **NEW**
- [ ] Test cluster summary view (read-only) **NEW**
- [ ] Test countdown timer accuracy **NEW**
  - [ ] Configure notification preferences
- [ ] Create progress tracking components
- [ ] Update navigation structure
- [ ] Create approval workflow UI
- [ ] Add role-based access control (Event Owner = Super Admin) **UPDATED**
### Phase 3: Backend API Updates
1. Create Event CRUD endpoints
2. Create Cluster management endpoints
3. Update existing endpoints to be event-scoped
4. Implement approval workflows
5. Add progress calculation logic

### Phase 4: Frontend Refactor
1. Create Event Dashboard
2. Create Cluster Management pages
3. Update Treasury page
4. Create Budget Management page
5. Update Subcommittee pages
6. Implement progress tracking UI

---

## 📋 Implementation Checklist

### Backend (Django)
- [ ] Create Event model and migrations
- [ ] Create EventMember model and migrations
- [ ] Create ClusterGroup model and migrations
- [ ] Create ClusterContribution model and migrations
- [ ] Create ClusterDeposit model and migrations
- [ ] Create BudgetItem model and migrations
- [ ] Modify Committee model (add event_id, is_main, committee_type)
- [ ] Modify Task model (add progress_percentage)
- [ ] Modify Expense model (add multi-approval fields)
- [ ] Modify Collection model (add source_type, cluster_id)
- [ ] Create Event serializers and viewsets
- [ ] Create Cluster serializers and viewsets
- [ ] Create Budget serializers and viewsets
- [ ] Update existing serialevent owners (super admin functions) **NEW**
- [ ] Create user guide for event schedule management **NEW**
- [ ] Create user guide for cluster leaders
- [ ] Create user guide for treasurer
- [ ] Create user guide for budget committee
- [ ] Create user guide for budget adjustment requests **NEW**
- [ ] Create user guide for audit log review **NEW**
- [ ] Create user guide for notification system **NEW**
- [ ] Update deployment documentation
- [ ] Document Africa's Talking SMS integration **NEW**w features
- [ ] Update permissions and access control

### Frontend (React)
- [ ] Create EventDashboard page
- [ ] Create EventSetup wizard (create event + main committee)
- [ ] Create ClusterManagement page
- [ ] Create ClusterContribution form (for cluster leaders)
- [ ] Create ClusterDeposit form (deposit to treasurer)
- [ ] Update Treasury page (3 tabs: Receipts, Requisitions, Deposits)
- [ ] Create BudgetManagement page
- [ ] Update Subcommittee pages (add edit permissions)
- [ ] Create progress tracking components
- [ ] Update navigation structure
- [ ] Create approval workflow UI
- [ ] Add role-based access control
- [ ] Update routing (event-scoped URLs)

### Testing
- [ ] Test event creation workflow
- [ ] Test main committee setup
- [ ] Test subcommittee creation and editing
- [ ] Test cluster creation and management
- [ ] Test contribution logging
- [ ] Test deposit workflow
- [ ] Test treasury receipt mapping
- [ ] Test requisition approval (3-person)
- [ ] Test budget item creation and allocation
- [ ] Test progress calculation
- [ ] Test role-based permissions

### Documentation
- [ ] Update API documentation (Phase 3)
- [ ] Create user guide for event setup
- [ ] Create user guide for cluster leaders
- [ ] Create user guide for treasurer
- [ ] Create user guide for budget committee
- [ ] Update deployment documentation

---

## 🚀 Implementation Timeline

### Week 1: Database & Backend Foundation
- Days 1-2: Create all new models and migrations
- Days 3-4: Create serializers and viewsets
- Days 5-7: Implement core API endpoints

### Week 2: Backend Logic & Workflows
- Days 1-2: Progress calculation logic
- Days 3-4: Approval workflow logic
- Days 5-7: Auto-logging for budget items

### Week 3: Frontend Core Pages
- Days 1-2: Event Dashboard
- Days 3-4: Cluster Management
- Days 5-7: Budget Management

### Week 4: Frontend Specialized Features
- Days 1-2: Treasury page redesign
- Days 3-4: Subcommittee detail pages
- Days 5-7: Progress tracking UI

### Week 5: Testing & Documentation
- Days 1-3: Comprehensive testing
- Days 4-5: Documentation updates
- Days 6-7: User acceptance testing

---

## ⚠️ Breaking Changes & Considerations

### 1. URL Structure
**Old**: `/committees/:id/tasks`  
**New**: `/event/subcommittee/:id/tasks`

### 2. API Endpoints
**Old**: `GET /api/committees/`  
**New**: `GET /api/events/:eventId/subcommittees/`

### 3. Data Access
- All data now scoped to a single event
- Users can only access one event at a time
- Need event selection if supporting multiple events per instance

### 4. Permissions
- New roles: Chairman, Secretary, Treasurer (main committee)
- Cluster Leaders can log contributions and deposits
- Budget Committee can approve all logged activities
- Requisition approval requires 3 signatures

### 5. Backward Compatibility
- Existing data will be migrated to single event structure
- Old URLs will redirect to new structure
- API v1 endpoints deprecated, v2 event-centric

---

## 📝 Next Steps

### Immediate Actions
1. **Review this plan** - Confirm requirements match your vision
2. **Approve architecture** - Verify database schema meets needs
3. **Prioritize features** - Which features are MVP vs nice-to-have?
4. **Set timeline** - Confirm 5-week timeline or adjust

### ✅ Design Decisions (CONFIRMED)

1. **Single Event Per System Instance** ✅
   - One main event per system
   - Sub-events handled via Event Schedule (memorial mass, traveling home, burial date)
   - Managed by Program, Eulogy & Media Committee

2. **Event Owner Permissions** ✅
   - Super admin rights (full edit access)
   - All actions logged with audit trail (who did what when)

3. **Cluster Visibility** ✅
   - Read-only summary across clusters (totals, progress %)
   - Full details visible only to cluster's own members

4. **Budget Adjustments** ✅
   - Committee leads can request budget adjustments with reasons
   - Must be approved by Budget & Finance Committee
   - Request tracking and approval workflow

5. **Notifications** ✅
   - SMS/Email alerts for pending approvals
   - Notifications for deposit confirmations
   - Alerts for upcoming deadlines

6. **Dashboard Enhancements** ✅
   - Budget summary (allocated vs spent)
   - Collection summary (target vs collected)
   - Countdown to main event
   - Upcoming sub-events and scheduled meetings

---

**Status**: ✅ APPROVED - Ready for Implementation

**Estimated Effort**: ~200 hours (5 weeks full-time)  
**Risk Level**: HIGH (major refactor)  
**Benefit**: Fully aligned with actual event management workflows
