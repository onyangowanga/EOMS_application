
# Budget Tab Layout Instructions for Copilot

This document provides a complete specification for building the **Budget Tab** under the Subcommittee Details Page in the EOMS React Web Application. It is structured as context for GitHub Copilot to generate clean, functional, and mobile-first frontend code.

---

# 🎯 Purpose of the Budget Tab
The **Budget Tab** allows subcommittee leads, finance committee members, and event officials to:
- View budget allocations
- Track pending and approved budget items
- Create manual budget items
- See auto-created budget items from tasks
- Monitor budget usage and remaining balance
- View approval progress for each item

---

# 🧭 Tab Location
Appears inside:
```
/event/:eventId/subcommittees/:subcommitteeId
```
Under the tab navigation:
```
Overview | Tasks | Members | Budget | Reports
```

---

# 🧱 Page Layout Structure
```
-------------------------------------------------------------
| Budget Overview Card                                        |
| - Allocated Budget                                          |
| - Used Budget                                               |
| - Pending Amount                                            |
| - Remaining Budget                                          |
-------------------------------------------------------------
|  [+ Add Budget Item] (Button or FAB on mobile)              |
-------------------------------------------------------------
| Budget Items List                                           |
| ---------------------------------------------------------   |
| | Item Title                                             | |
| | Amount: KES X                                           | |
| | Status: Pending / Approved / Declined                  | |
| | Linked Task: <task title or None>                      | |
| ---------------------------------------------------------   |
-------------------------------------------------------------
```

---

# 📑 Components Required
- **BudgetOverviewCard**
- **BudgetItemCard**
- **AddBudgetItemModal**
- **ProgressBar** (for approval progress)
- **FAB (Floating Action Button)**
- **EmptyState** (in case no budget items exist)

---

# ➕ Add Budget Item Button
### Desktop:
A button at the top-right of the Budget tab: `+ Add Budget Item`.

### Mobile:
A floating action button (FAB) with `+` icon.

---

# 🟦 Add Budget Item Modal
### Modal Title:
```
Create Budget Item
```

### Fields:
- **Title** (required)
- **Description** (optional)
- **Estimated Cost** (required)
- **Linked Task** (optional dropdown of tasks under this subcommittee)
- **Subcommittee** (auto-filled and read-only)

### Notes:
- Estimated cost must be added.
- Form validates number fields.
- Submit creates a pending budget item.

### On Submit:
```
POST /api/subcommittees/:id/budget-items/
``` 
Payload example:
```json
{
  "title": "Transport for body pickup",
  "description": "Hearse and van costs",
  "estimated_cost": 25000,
  "linked_task": 12
}
```

---

# 📊 Budget Items List
Each **BudgetItemCard** displays:
- Title
- Description
- Amount
- Status: Pending / Approved / Declined
- Created date
- Created by
- Linked Task (optional)
- Approval progress:
  - Chairman
  - Treasurer
  - Finance Committee Member

### Buttons (based on permissions):
- View Details
- Submit for Approval (if editable)
- View Approval Chain

---

# 🧮 Budget Calculations
Frontend should compute:
- **Used Budget**: sum of approved items
- **Pending Budget**: sum of pending items
- **Remaining Budget**: allocated - used

Allocate budget comes from event structure or finance committee.

---

# 🚦 Permissions Logic
### Users allowed to create budget items:
- Subcommittee Lead
- Chairman
- Secretary
- Treasurer
- Finance Committee Member

### Users allowed to view only:
- Event members assigned to this subcommittee

---

# ⚙️ Expected Backend Endpoints
### Fetch budget items:
```
GET /api/subcommittees/:id/budget-items/
```

### Create budget item:
```
POST /api/subcommittees/:id/budget-items/
```

### Approvals (already implemented elsewhere):
```
PATCH /api/budget-items/:itemId/approve/
```

---

# 🧩 Additional UI Components
- **SectionHeader** (for mobile grouping)
- **CostBadge** (KES formatting)
- **StatusChip** (Pending/Approved/Declined)
- **ApprovalProgress** (3-step approval indicator)

---

# 🚀 Copilot Build Instructions Summary (Paste into VS Code)

> Build the `BudgetTab` component inside the SubcommitteeDetailsPage. Use React + TypeScript + Material UI + TanStack Query. The tab must show: a Budget Overview card with allocated, used, pending, and remaining budget; an Add Budget Item button (or FAB on mobile); and a list of BudgetItemCards showing title, description, cost, status, linked task, and approval progress. Include modal to create new budget items with fields for title, description, estimated cost, and linked task. Integrate with backend endpoints (`GET /subcommittees/:id/budget-items` and `POST /subcommittees/:id/budget-items`). Must be mobile-first.

---

# End of Document
