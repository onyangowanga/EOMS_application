
# Finance Architecture Fix (EOMS)

This document explains the **correct architecture for handling Finance & Budget functionality** in the EOMS system. It restructures how the Finance Module, Budget Items, Requisitions, and Executive roles should work, ensuring governance, transparency, and scalability.

It is optimized as developer context for GitHub Copilot.

---

# 🎯 Why This Fix Was Needed

The earlier setup treated:
- Finance & Budget Committee
- Executive Committee

as **normal subcommittees**, which caused:
- Incorrect task behavior
- Wrong UI placement
- Budget duplication
- Confusion between operational and governance layers

This fix redefines the architecture into **three distinct layers**.

---

# 🟩 Layer 1 — Executive Leadership (Top Layer)

This is **NOT a committee**. It is a leadership layer composed of:
- Chairman
- Secretary
- Treasurer
- Event Owners
- Event Admins

### Responsibilities:
- Top-level approvals
- Governance decisions
- View full financial dashboards

### Should NOT:
- Appear in subcommittee list
- Create tasks
- Behave like an operational unit

### In UI:
Accessible under:
```
Event Dashboard → Officials
```

---

# 🟥 Layer 2 — Finance & Budget Committee (Governance Layer)

This is also **NOT an operational subcommittee**.
It is a **special governance module**, responsible for:

### ✔ Setting the Overall Event Budget
- Estimated total budget
- Financial strategy
- Cashflow expectations

### ✔ Allocating Budgets to Subcommittees
Prevents unlimited requests.

### ✔ Reviewing Budget Items (from subcommittees)
- Approve / decline
- Adjust amounts

### ✔ Reviewing Requisitions
- Validate spending requests

### ✔ Working with Treasurer
- Verify payments
- Track expenditures

---

# 🟦 Layer 3 — Operational Subcommittees (Work Execution Layer)

These are normal committees like:
- Transport
- Catering
- Media
- Mobilisation
- Hospitality
- Body Handling

They:
- Create tasks
- Add estimated costs
- Generate budget items (auto)
- Track progress

These committees **DO NOT** manage the event-wide budget.
They only handle their own scope.

---

# 🧭 Correct Navigation Structure

### **Event Dashboard**
- Officials
- Operational Progress
- Financial Progress Summary
- Quick Links to:
  - Finance Module
  - Subcommittees
  - Clusters

---

# 📁 Subcommittees Module (Operational)
- Subcommittee List
- Subcommittee Details
  - Overview
  - Tasks
  - Members
  - **Budget Tab (Subcommittee-only view)**
  - Reports

The Subcommittee Budget Tab should show ONLY:
- Budget allocated
- Budget items created under this subcommittee
- Approval status
- Used vs remaining

It is NOT the main budget dashboard.

---

# 💼 Finance Module (Governance)
This is where the **Finance & Budget Committee operates**.

## **1. Budget Dashboard (Master View)**
Shows:
- Total Estimated Budget
- Approved Budget
- Pending Budget
- Remaining Budget
- Cash in hand (Treasurer)
- Collections vs expenses

## **2. Budget Items Page (Required)**
Central place for:
- Reviewing all pending budget items
- Editing amounts
- Approving or declining
- Filtering by committee
- Linking to tasks

Finance needs this to avoid:
- Duplicate budgets
- Inflated amounts
- Hidden costs

## **3. Requisitions Page (Required)**
Dedicated page for:
- Requisition approvals
- Validating requested amounts
- Ensuring approved budget exists
- Viewing approval chain

Treasurer uses this page to process payments.

## **4. Subcommittee Allocation Page**
Used to:
- Assign budgets to committees
- Update ceilings
- Track variances

## **5. Payments Page (Treasurer)**
Used to:
- Log payments
- Link payments to requisitions
- Attach receipts
- Update expenditure

---

# 🔗 How Layers Work Together

### ✔ Subcommittee → Creates Task
If cost entered → auto Budget Item

### ✔ Finance Committee → Reviews & Approves Budget Item
Costs become part of event budget.

### ✔ Subcommittee → Requests Funds (Requisition)
Only allowed after approval.

### ✔ Finance Committee → Approves Requisition
Must pass 3 approval levels.

### ✔ Treasurer → Makes Payment
Payment updates statistics.

### ✔ Event Dashboard → Shows Updated Financial Progress
Everything rolls up.

---

# ❌ What Should NOT Happen
- Finance Committee should not appear in "Subcommittees".
- Executive Committee should not be treated as a working committee.
- Finance Committee should not create operational tasks.
- Budget dashboard should not live under subcommittees.

---

# ✔️ Summary of UI Changes Needed

### Remove from Subcommittees:
- Finance Committee
- Executive Committee

### Add as Separate Modules:
```
Event Dashboard
 → Finance Module
     → Budget Dashboard
     → Budget Items
     → Requisitions
     → Payments
     → Allocations

 → Officials (Executive Committee)
```

---

# End of Document
