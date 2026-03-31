
# Event Dashboard Layout Specification (EOMS)

This document defines the complete **Event Dashboard** layout, workflow, UI structure, and API expectations for the EOMS system. It is optimized as context for GitHub Copilot to implement the dashboard in React (TypeScript + Material UI + TanStack Query).

---

# 🎯 Purpose of the Event Dashboard

The Event Dashboard is the **central command center** for the entire event. It gives a unified real-time overview across:
- Operational progress
- Financial progress
- Subcommittee performance
- Cluster mobilisation
- Approvals and alerts
- Event milestones and timeline
- Executive summary widgets

This page is the main landing page for all officials, subcommittee leads, finance teams, cluster leaders, and admins.

Route:
```
/event/:eventId/dashboard
```

---

# 🧱 Page Structure (Mobile-first)
```
-------------------------------------------------------
| Header: Event Name + Status + Date                  |
-------------------------------------------------------
| Executive Summary Widgets (KPIs)                    |
| - Operational Progress                              |
| - Financial Progress                                |
| - Funds Collected                                   |
| - Funds Spent                                       |
-------------------------------------------------------
| Quick Actions / Navigation Buttons                  |
-------------------------------------------------------
| Subcommittee Overview Grid                          |
-------------------------------------------------------
| Finance Summary Preview                             |
-------------------------------------------------------
| Cluster Mobilisation Summary                        |
-------------------------------------------------------
| Approvals & Alerts                                  |
-------------------------------------------------------
| Timeline & Milestones                               |
-------------------------------------------------------
```

---

# 🟦 1. Header Section

Shows key event metadata:
- Event title
- Event type (Funeral / Wedding / Fundraiser)
- Event status (Planning / Active / Completed)
- Event date
- "Edit Event" (Admins only)

Responsive:
- Desktop → Full header with details
- Mobile → Collapsed top bar

---

# 🟩 2. Executive Summary KPIs

## KPI 1 — Operational Progress
Circular progress indicator showing:
```
Average % of tasks completed across all subcommittees
```

## KPI 2 — Financial Progress
```
Approved Budget vs Total Collections
```

## KPI 3 — Funds Collected
Shows total confirmed funds:
- Clusters
- General contributions
- Direct donors

## KPI 4 — Funds Spent
Shows total paid requisitions.

---

# 🟧 3. Quick Actions Bar
Buttons shown depend on user role.

### Possible buttons:
- "Finance Module"
- "Subcommittees"
- "Clusters"
- "Approvals Center"
- "Create Subcommittee"
- "Add Committee Member"
- "Add Budget Allocation"

On mobile → show horizontally scrollable chips.

---

# 🟪 4. Subcommittee Overview Grid
Each subcommittee is shown as a card:
- Name
- Lead
- Progress bar (task average)
- Deadline
- Task count
- Budget allocated & used
- Status badge (On track / At risk)

Clicking opens:
```
/event/:eventId/subcommittees/:id
```

---

# 🟫 5. Finance Summary Section
This is a preview of the Finance Module.

### Shows:
- Total estimated budget
- Approved budget
- Pending budget items
- Used budget
- Remaining budget

### Mini Charts:
- Budget vs Expenditure
- Daily financial trend

### CTA:
```
Open Finance Module
```

---

# 🌐 6. Cluster Mobilisation Summary
Shows contribution performance per cluster.

### For each cluster:
- Name
- Target
- Collected
- Pledged
- Progress %
- Status indicator

Includes a pie chart showing shares per cluster.

CTA:
```
Open Mobilisation Module
```

---

# 🚨 7. Approvals & Alerts Section
Shows pending items requiring attention.

### Pending Approvals:
- Budget items
- Requisitions
- Payments
- Cluster submissions

### Alerts:
- Overdue tasks
- Subcommittees behind schedule
- Budget overrun risk
- Unsubmitted cluster funds

Each item links to the appropriate module.

---

# 🕒 8. Timeline & Milestones
Shows event progress chronologically:
- Event creation
- Major milestones
- Scheduled activities
- Deadlines
- Final event date

Layout:
- Mobile → Vertical timeline
- Desktop → Horizontal timeline

---

# 🧠 9. Role‑Based Visibility
Different users see different dashboard content.

### Ordinary Member:
- Their subcommittee
- Their tasks

### Subcommittee Lead:
- Their subcommittee card expanded
- Budget preview for their committee

### Finance Committee:
- Finance summary
- Pending approvals

### Treasurer:
- Funds received
- Pending payments

### Executive (Chair/Secretary/Treasurer):
- All operational + financial modules

### Admin:
- Full access to everything

---

# 📡 10. Dashboard API Endpoints
Recommended endpoints:
```
GET /api/events/:id/dashboard/summary
GET /api/events/:id/subcommittees/overview
GET /api/events/:id/finance/summary
GET /api/events/:id/clusters/summary
GET /api/events/:id/alerts
GET /api/events/:id/timeline
```

A combined endpoint may improve performance.

---

# 🧩 11. React Components Needed
- <EventDashboardHeader />
- <KPIWidget />
- <QuickActionsBar />
- <SubcommitteeCard />
- <FinancePreviewCard />
- <ClusterCard />
- <ApprovalsSummary />
- <AlertsList />
- <Timeline />

Modular and reusable across the app.

---

# ✔ End of Document
