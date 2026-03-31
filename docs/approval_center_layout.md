
# Approval Center Layout Specification (EOMS)

This document defines the **Approval Center** module for the Events Operations Management System (EOMS). It centralizes all approvals required across the event lifecycle: budget items, requisitions, treasury confirmations, cluster submissions, and payments. It is optimized for use with GitHub Copilot in React + TypeScript development.

---

# 🎯 Purpose of the Approval Center

The **Approval Center** is the unified hub where all decision-makers (Chairman, Treasurer, Secretary, Finance Committee Members) can:
- Review and approve pending budget items
- Review and approve requisitions
- Approve payment executions
- Confirm treasury receipts
- Validate cluster submissions

This ensures transparency, accountability, and rapid decision-making.

Located under:
```
Event Dashboard → Approvals Center
```

---

# 🧭 Route Definition
```
/event/:eventId/approvals
```

---

# 🧱 Page Structure (Mobile-first)
```
--------------------------------------------------------
| Header: Approval Center                               |
--------------------------------------------------------
| Tabs: All | Budget Items | Requisitions | Payments   |
|       | Cluster Submissions | Treasury Confirmations |
--------------------------------------------------------
| Filters: Status | Committee | Date Range             |
--------------------------------------------------------
| Approval Items List (cards or table)                 |
--------------------------------------------------------
| Slide-over Panel / Modal for Approval Details        |
--------------------------------------------------------
```

---

# 🟧 1. Header Section
Shows:
- Page title: **Approval Center**
- Number of pending approvals
- User’s approval role (Chair / Treasurer / Finance Member)

Responsive layout collapses metadata for mobile.

---

# 🟦 2. Tabs Definition

The Approval Center has **6 tabs**, each representing a workflow:

### **Tab 1: All Approvals**
Displays all pending items merged chronologically.

### **Tab 2: Budget Items**
Shows budget items awaiting approval from:
- Chairman
- Treasurer
- Finance Committee Member

### **Tab 3: Requisitions**
Shows spending requests needing approval.

### **Tab 4: Payments**
Shows payments needing Treasurer execution.

### **Tab 5: Cluster Submissions**
Approvals for funds submitted by Cluster Leads.

### **Tab 6: Treasury Confirmations**
Incoming funds waiting for confirmation.

---

# 🟩 3. Approval Item Card Structure
Each approval item displays as a card (mobile) or row (desktop).

```
--------------------------------------------------------
| Title (Budget Item / Requisition / Payment / Cluster) |
| Amount / Summary                                       |
| Status: Pending | Approved | Declined                  |
| Requested By: Person                                   |
| Submitted On: Date                                     |
| Approvers Needed: Icons                                |
| [View Details]                                         |
--------------------------------------------------------
```

### Status Chips:
- Pending
- Approved
- Declined
- Awaiting Treasurer
- Awaiting Confirmation

### Approver Icons Example:
- 🏛 Chairman
- 💰 Treasurer
- 📊 Finance Member
- 🔗 Cluster Lead

---

# 🟥 4. Approval Detail Drawer / Modal
When clicking “View Details”, open a slide-over drawer.

### Shows:
- Category (Budget Item / Requisition / Payment)
- Title
- Description
- Amount
- Related Task (if any)
- Related Subcommittee
- Created By
- Approval Chain (visual timeline)
- Comments section

### Actions:
- **Approve**
- **Decline** (with reason)
- **Request More Info**

Only shown based on user role.

---

# 🟫 5. Approval Chain Model (Frontend Representation)
```
[Chairman] → [Treasurer] → [Finance Member]
```
Each node has:
- Status: pending / approved / declined
- Timestamp
- User who approved

For Payments:
```
[Finance Approval Complete] → [Treasurer Execution]
```

For Cluster Submissions:
```
[Cluster Lead submits] → [Treasurer confirms receipt]
```

---

# 🟪 6. Filters Bar
Enables users to filter approvals.

### Filters:
- **Status** (Pending, Approved, Declined)
- **Type** (Budget, Requisition, Payment, Cluster)
- **Committee** (Transport, Catering, Finance, etc.)
- **Date range**
- **Amount range**

---

# 🌐 7. API Expectations

### Fetch all approvals:
```
GET /api/events/:id/approvals
```

### Filtered fetch example:
```
GET /api/events/:id/approvals?type=budget&status=pending
```

### Approve item:
```
POST /api/approvals/:approvalId/approve
```

### Decline item:
```
POST /api/approvals/:approvalId/decline
```

### Confirmation (Treasurer):
```
POST /api/approvals/:approvalId/confirm
```

---

# 🧩 8. Components Needed
- <ApprovalTabs />
- <ApprovalList />
- <ApprovalCard />
- <ApprovalDetailsDrawer />
- <ApprovalChain />
- <StatusChip />
- <FilterBar />

---

# ✔ End of Document
