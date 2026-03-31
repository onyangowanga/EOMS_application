
# Finance & Budget Committee Workflow (EOMS)

This document defines the **complete Finance & Budget Committee workflow** for the EOMS (Events Operations Management System). It is optimized as context for GitHub Copilot and outlines the committee’s authority, responsibilities, decision-making flow, and UI/UX expectations.

---

# 🎯 Purpose of the Finance & Budget Committee

Unlike ordinary subcommittees, the **Finance & Budget Committee** is a **governance and oversight unit**, not an operational unit. It ensures financial transparency, prevents overspending, and enforces financial discipline.

It performs six major functions:
1. Set the overall event budget
2. Allocate budgets to subcommittees
3. Approve or decline budget items raised by subcommittees
4. Approve or decline requisitions tied to approved budget items
5. Track event-wide financial progress
6. Validate payments before the Treasurer executes them

---

# 🧭 Position in Event Structure

The Finance & Budget Committee sits at the center of the financial flow:
```
Subcommittee Task → Budget Item → Finance Committee Approval → Requisition → Treasurer Payment → Budget Overview
```

It does **not**:
- Perform operational tasks
- Create routine task budgets
- Duplicate subcommittee budgets

It **does**:
- Validate budgets
- Allocate funds
- Approve spending

---

# 🏦 1. Setting the Overall Event Budget

Before operations begin, the Finance Committee creates the **Event Budget Framework**:
- Total expected expenses
- Anticipated income sources (clusters, contributions, pledges)
- Reserve amounts
- Budget ceilings per subcommittee

This becomes the foundation for all financial decisions.

## Output of this step:
- **Event Estimated Budget**
- **Subcommittee Allocations**
- **Financial Policy** (e.g., approval requirements, limits)

---

# 🧩 2. Allocating Budgets to Subcommittees

Finance Committee allocates funds to each subcommittee based on event needs:
```
Transport: 150,000
Catering: 120,000
Media: 80,000
Mobilisation: 20,000
```

These allocations appear on each subcommittee’s **Budget Tab**.

### Effects:
- Subcommittees know their spending limits
- Prevents unplanned or inflated cost estimates
- Tracks variance between allocated vs. actual costs

---

# 📝 3. Reviewing Budget Items (From Tasks)

Subcommittees create tasks; tasks may include **estimated_cost**.

If provided:
- System auto-generates a **Budget Item**
- Status = **Pending**

Finance Committee reviews each Budget Item:
- Check necessity
- Validate cost
- Compare to subcommittee allocation
- Edit amount if needed

### Approval Chain (3-Level)
- Chairman
- Treasurer
- One Finance Committee Member

A Budget Item becomes **Approved** only after all three approvals.

---

# 💸 4. Reviewing Requisitions (Requesting Money)

Once a Budget Item is **Approved**, the Subcommittee Lead may create a **Requisition**.

A Requisition must include:
- `budget_item_id`
- `requested_amount`
- `purpose`
- `date_needed`

### Approval Chain (same as budget items):
- Chairman
- Treasurer
- Finance Committee Member

Approved Requisitions appear in the **Treasurer’s Payment Queue**.

---

# 🧾 5. Treasurer Payments

After approval, the Treasurer:
- Pays the requested amount
- Logs payment details
- Attaches receipt (optional)

### Payment Record Includes:
```
requisition_id
amount_paid
paid_by
date_paid
payment_method
receipt_url
```

Payment updates:
- BudgetItem "paid" status
- Event Budget Overview
- Subcommittee used budget

---

# 📊 6. Budget Overview (Event-Level)

This dashboard aggregates all financial data:

- Total Estimated Budget
- Subcommittee Allocations
- Approved Budget
- Pending Budget
- Paid/Used Budget
- Remaining Budget
- Cash in hand (Treasurer)
- Cluster contributions & pledges

---

# ⚖️ 7. Why Requisitions MUST Be Linked to Budget Items

This prevents:
- Unbudgeted spending
- Duplicate budget lines
- Financial leakage

Only **approved** Budget Items can generate Requisitions.

This creates a **transparent financial chain**:
```
Task → Budget Item → Approval → Requisition → Payment
```

---

# 🖥️ 8. Frontend UI/UX Expectations

## Finance & Budget Committee Dashboard
- Event budget overview
- Subcommittee allocations
- Pending Budget Items
- Pending Requisitions
- Payments overview
- Financial progress charts

## Budget Items Review Page
- Pending items list
- Approve / Decline buttons
- Edit cost
- Link to related task
- Approval progress view

## Subcommittee Allocation Page
- List of committees
- Allocation inputs
- Variances tracked

## Requisitions Review Page
- Request details (amount, purpose, linked budget item)
- Approve / Decline buttons
- Links to payment view

---

# 🧩 9. Backend Architecture Summary

### Models Involved:
- BudgetItem
- Subcommittee
- Task
- Requisition
- Payment
- EventBudget
- SubcommitteeAllocation

### Core Logic:
- BudgetItem auto-created from tasks with estimated_cost
- Approval chains stored in Approval model
- Requisition must reference a BudgetItem
- Payment must reference Requisition

---

# 🧾 10. Permissions Summary

### Finance Committee Can:
- Approve/decline budget items
- Adjust budget item amounts
- Allocate funds to subcommittees
- Approve requisitions
- View all finances

### They Cannot:
- Create tasks
- Create operational budget items (subcommittees do)

### Treasurer Can:
- Approve payments
- Execute payments
- Confirm cluster submissions

---

# ✔️ End of Document
