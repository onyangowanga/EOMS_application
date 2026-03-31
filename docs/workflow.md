
# Task → Budget Item → Requisition → Payment Workflow (EOMS)

This document defines the **complete operational and financial workflow** for Tasks, Budget Items, Requisitions, and Payments in the EOMS system. It is written as developer context for GitHub Copilot.

This version includes the newly added logic:
- **Estimated Cost field** in Task creation form (optional)
- **Backend support for optional estimated_cost field**
- **Automatic creation of Budget Item if estimated_cost is provided**

---

# 1. Task Lifecycle & Execution Logic

## Task Stages
A Task belongs to a Subcommittee and moves through the following stages:

1. **To-Do** → 0%
2. **In Progress** → 10%–80%
3. **Blocked** → freezes progress
4. **Ready for Review** → ~90%
5. **Completed** → 100%

Users who can update task progress:
- Task assignee
- Subcommittee lead
- Event officials (Chair, Secretary, Treasurer)
- System Admin

## Task Structure (Updated)
A Task now includes an optional field:
```
estimated_cost: number | null
```

If `estimated_cost` > 0 → Automatically triggers Budget Item creation.

Example request:
```json
{
  "title": "Hire PA system",
  "description": "Public address setup for service",
  "assigned_to": 22,
  "deadline": "2026-04-05",
  "estimated_cost": 15000
}
```

---

# 2. Automatic Budget Item Creation From Tasks

Whenever a task is created **with an estimated cost**, the backend automatically generates a Budget Item:

### Auto-created Budget Item Fields
```
title = task.title
estimated_cost = task.estimated_cost
linked_task = task.id
status = "Pending"
subcommittee = task.subcommittee
created_by = task.creator
```

### Purpose
This ensures:
- Every cost-related activity is captured
- Subcommittees cannot bypass budget approval
- Finance transparency

If a task is created WITHOUT cost → No budget item is created.

---

# 3. Budget Item → Budget Overview Integration

All budget items roll up into the event’s main budget overview:

### Total Budget Estimate
```
Sum(all Budget Items: approved + pending)
```

### Used Budget
```
Sum(all Paid items)
```

### Pending Budget
```
Sum(all Pending items)
```

### Remaining Budget
```
Total Estimate - Used Budget
```

### Budget Overview UI Should Show:
- Total Estimated Budget
- Approved Budget
- Pending Budget
- Paid/Used Budget
- Remaining Budget

---

# 4. Requisitions Logic (Tied to Budget Items)

A **Requisition MUST be tied to a Budget Item**.

This ensures financial discipline:
- No requisition without a budgeted cost
- Prevent overspending
- Provide justification trail

### Requisition Fields
```
id
budget_item_id (FK)
requested_amount
requested_by
subcommittee_id
description
status (pending, approved, rejected, paid)
created_at
```

### Workflow
1. Subcommittee Lead opens a Budget Item
2. Clicks “Request Funds”
3. Submits requisition → status: Pending
4. Approval required from:
   - Chairman
   - Treasurer
   - Finance Committee Member
5. If approved → Treasurer pays → status: Paid

---

# 5. Payment Logging and Completion

Treasurer records payments for approved requisitions.

### Payment Fields
```
id
requisition_id
amount_paid
paid_by
date_paid
payment_method
receipt_upload_url
```

After payment:
- Budget usage is updated
- Cluster balances update if relevant
- Event Financial Progress recalculates

---

# 6. UI Requirements Summary (Frontend + Copilot Context)

## Task Creation Form (Updated)
Fields:
- Title
- Description
- Assigned To
- Deadline
- Estimated Cost (Optional — number input)

If estimated cost is provided:
- Show hint: “A Budget Item will be created automatically.”

## Budget Tab
Must show:
- Overview card
- Budget Item list
- Approval status
- Payments
- Button: “Create Budget Item” (manual)

## Requisition Form
Appears inside a Budget Item modal:
- Request Amount
- Purpose
- Date Needed
- Submit → triggers approval workflow

---

# 7. Backend Requirements Summary

## Task Serializer (Add Field)
```
estimated_cost = serializers.DecimalField(..., required=False, allow_null=True)
```

## Task Create View Logic
If `estimated_cost` is provided and > 0:
- Create Task
- Create BudgetItem(task=task)

## Requisition Model
```
budget_item = ForeignKey(BudgetItem)
requested_amount = DecimalField()
``` 

## Event Budget Overview Calculation
Should aggregate from BudgetItem + Payment models.

---

# End of Document
