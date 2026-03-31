# Event Reports Page Specification

## Overview

This document defines the complete **Reports Page** module for the Events Operations Management System (EOMS). It specifies layout, workflows, UI components, data sources, and API contracts for the React + TypeScript frontend.

---

## Purpose & Audience

The Reports Page provides complete transparency across all event operations and finances. It consolidates key metrics and detailed breakdowns to support informed decision-making.

### Key Metrics Tracked
- Operational progress (task completion, subcommittee performance)
- Financial health (budget utilization, income vs. expenses)
- Cluster mobilization progress (fundraising targets vs. collected)
- Subcommittee activity and member participation
- Timeline adherence and milestone tracking

### Intended Users
- **Executive Officials** — Overview of event status and budget
- **Finance & Budget Committee** — Detailed financial ledgers and approvals
- **Subcommittee Leads** — Performance metrics and task breakdowns
- **Event Owners** — Summary insights and export capabilities

### Route
```
/event/:eventId/reports
```

---

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Reports — [Event Name]                           |←  ⚙ │
├─────────────────────────────────────────────────────────┤
│  Summary | Operations | Finance | Clusters | Members    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Filters & Controls]                                   │
│  Date Range | Export | Refresh                          │
│                                                         │
│  [Tab Content]                                          │
│  Charts, tables, KPI cards                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Filters & Controls

All tabs support the following controls:
- **Date Range Selector** — Filter data by event period (default: entire event)
- **Export Buttons** — PDF, Excel, JSON formats
- **Refresh Button** — Reload data from API (manual cache refresh)
- **Print Preview** — Browser print-friendly view

---

## Tab 1: Summary Report (Default View)

**Purpose:** Executive-level overview with key performance indicators and top insights.

### Key Performance Indicators (KPI Cards)
Display in a responsive grid with icon, value, and percent change:
- **Operational Progress** — % of tasks completed
- **Financial Progress** — % of budget utilized
- **Total Funds Collected** — Actual amount received
- **Total Funds Spent** — Amount paid from budget
- **Total Budget Estimate** — Initial estimate
- **Remaining Budget** — Unspent amount
- **Tasks Completed** — Count and % complete
- **Mobilization Progress** — Overall cluster target achievement %

### Charts
1. **Daily Collections (Line Chart)** — Income trend over event timeline
2. **Subcommittee Progress (Bar Chart)** — Task completion % by subcommittee
3. **Expense Distribution (Pie Chart)** — Breakdown by budget category

### Summary Tables
1. **Top 5 Overdue Tasks** — Title | Subcommittee | Days Overdue | Assigned To | Priority
2. **Top 5 Largest Expenses** — Item | Amount | Status | Date
3. **Latest Contributions** — Source | Amount | Date | Cluster
4. **Pending Approvals** — Item | Amount | Requester | Status

### Actions
- Export Summary as PDF
- Export Data as Excel (.xlsx)
- Export Data as JSON

---

## Tab 2: Operations Report

**Purpose:** Detailed view of task execution, subcommittee performance, and timeline status.

### Subcommittee Performance Table
Sortable by any column. Columns:
- **Subcommittee Name** — Link to subcommittee detail
- **Total Tasks** — Count of assigned tasks
- **Completed** — Count of finished tasks
- **Blocked** — Count of tasks with blockers
- **Overdue** — Count of past-due tasks
- **Progress %** — Visual progress bar (0–100)
- **Status Badge** — "On Track" (green) | "At Risk" (yellow) | "Critical" (red)

**Status Rules:**
- Green: ≥75% complete, ≤10% overdue
- Yellow: 50–74% complete OR 11–25% overdue
- Red: <50% complete OR >25% overdue

### Task Breakdown Table
Sortable and filterable by Status, Subcommittee. Columns:
- **Task Title** — Link to task detail
- **Subcommittee** — Assigned subcommittee
- **Assigned To** — Member name
- **Status** — Not Started | In Progress | Completed | Blocked
- **Progress %** — Visual progress bar
- **Deadline** — Date, with overdue indicator (red) if past
- **Linked Budget Item** — Budget category (if applicable)
- **Cost Estimate** — Estimated amount

### Charts
1. **Tasks by Status (Pie Chart)** — Distribution across all status values
2. **Subcommittee Progress (Bar Chart)** — Completion % comparison
3. **Tasks Over Time (Line Chart)** — Cumulative completion trend

---

## Tab 3: Finance Report

**Purpose:** Detailed financial position, budget tracking, and ledger transparency.

### Budget Overview Section
Display side-by-side KPI cards:
- **Total Estimated Budget** — Initial amount budgeted
- **Approved Budget** — Amount approved by committee
- **Pending Budget Items** — Count and total amount awaiting approval
- **Used Budget (Paid)** — Actual amount spent
- **Remaining Budget** — Unspent approved amount

### Income Ledger Table
Sortable by Date. Columns:
- **Source** — Donor, sales, or revenue category
- **Cluster** — Associated cluster (if applicable)
- **Amount** — Contribution amount
- **Date** — Receipt date
- **Type** — "Pledge" (committed) or "Actual" (received)
- **Submission Status** — "Submitted to Treasurer" or "Pending"

### Expense Ledger Table
Sortable by Date. Columns:
- **Budget Item** — Expense category/description
- **Subcommittee** — Responsible subcommittee
- **Amount Approved** — Approved budget
- **Amount Paid** — Actual amount spent
- **Date Paid** — Payment date
- **Status** — Pending | Approved | Paid
- **Notes** — Treasurer remarks or receipt reference

### Charts
1. **Income vs. Expense (Line Chart)** — Cumulative trends over time
2. **Budget vs. Actual (Pie Chart)** — Approved amount vs. spent amount
3. **Committee Budget Utilization (Bar Chart)** — % utilized by subcommittee

### Actions
- Export Full Financial Report as PDF
- Export Income Ledger as CSV
- Export Expense Ledger as CSV

---

## Tab 4: Cluster Mobilization Report

**Purpose:** Track fundraising progress, donor contributions, and cluster performance.

### Cluster Overview Table
Sortable by Progress %. Columns:
- **Cluster Name** — Name of cluster
- **Target Amount** — Fundraising goal
- **Collected** — Actual amount received
- **Pledged** — Amount committed but not yet received
- **Submitted to Treasurer** — Amount handed over
- **Outstanding** — Pledged amount still pending
- **Progress %** — Visual progress bar (Collected / Target)
- **Lead** — Cluster lead member name

### Collection Ledger Table
Filterable by Cluster. Columns:
- **Donor / Source** — Contributor name or source
- **Amount** — Contribution amount
- **Mode** — Cash | Bank Transfer | Check | Mobile Money
- **Date** — Contribution date
- **Pledge Status** — "Yes" (committed) or "No" (actual)
- **Submission Status** — "Submitted to Treasurer" | "Pending" | "Outstanding"

### Charts
1. **Cluster Contribution (Pie Chart)** — Amount breakdown by cluster
2. **Cluster Performance (Bar Chart)** — Progress % comparison across clusters

### Actions
- Export Cluster Report as PDF
- Export Collection Ledger as CSV

---

## Tab 5: Member Participation Report

**Purpose:** Track member engagement, task assignment, and participation levels.

### Member Activity Table
Sortable by Tasks Completed. Columns:
- **Name** — Member name
- **Role** — Chair | Treasurer | Vice-Chair | Member
- **Subcommittees Assigned** — List of assigned subcommittees (count)
- **Tasks Assigned** — Total tasks assigned to member
- **Tasks Completed** — Count of completed tasks
- **Completion Rate %** — Completed / Assigned %
- **Cluster Role** — Cluster Lead | Cluster Member | None

### Charts
1. **Member Participation Activity (Line Chart)** — Task completion trend per member over time
2. **Member Distribution by Committees (Bar Chart)** — Count of members per subcommittee

### Actions
- Export Member Activity Report as PDF

---

## UI Components Required

| Component | Purpose |
|-----------|---------|
| `<ReportTabs />` | Tab navigation between report sections |
| `<SummaryReport />` | Executive summary with KPIs and charts |
| `<OperationsReport />` | Operational metrics and task tracking |
| `<FinanceReport />` | Financial ledgers and budget tracking |
| `<ClusterReport />` | Cluster mobilization and donations |
| `<MembersReport />` | Member engagement and participation |
| `<ReportChart />` | Reusable chart wrapper (Line, Bar, Pie) |
| `<ReportTable />` | Reusable table with sorting and filtering |
| `<ExportButtons />` | Export PDF, Excel, JSON actions |
| `<KPICard />` | KPI metric display card |
| `<StatusBadge />` | Status indicator (On Track, At Risk, Critical) |

---

## API Contracts

### Base Endpoint
```
GET /api/events/:id/reports/{section}
```

### Available Sections
- `/api/events/:id/reports/summary` — KPIs and summary insights
- `/api/events/:id/reports/operations` — Task and subcommittee metrics
- `/api/events/:id/reports/finance` — Budget and ledger data
- `/api/events/:id/reports/clusters` — Cluster fundraising progress
- `/api/events/:id/reports/members` — Member participation metrics

### Query Parameters
- `start_date` (optional) — Filter data from this date (ISO 8601)
- `end_date` (optional) — Filter data to this date (ISO 8601)
- `format` (optional) — `json` (default) | `csv` | `pdf`

### Response Format (Example: Summary)
```json
{
  "event_id": "uuid",
  "event_name": "Annual Event 2024",
  "report_date": "2024-12-01T10:00:00Z",
  "kpis": {
    "operational_progress": 75.5,
    "financial_progress": 68.3,
    "total_funds_collected": 125000.00,
    "total_funds_spent": 85000.00
  },
  "charts": {
    "daily_collections": [...],
    "subcommittee_progress": [...],
    "expense_distribution": [...]
  },
  "tables": {
    "overdue_tasks": [...],
    "largest_expenses": [...],
    "latest_contributions": [...],
    "pending_approvals": [...]
  }
}
```

---

## Responsive Design Considerations

- **Desktop (≥1024px):** Full layout with side-by-side charts and tables
- **Tablet (640–1024px):** Stacked layout with single-column charts
- **Mobile (<640px):** Vertical stack, simplified tables, card-based KPIs
- **Export:** All formats maintain readability across devices
- **Print:** Landscape orientation for tables, color-safe output for PDFs

---

## Accessibility & Performance

- **Keyboard Navigation:** Tab through filters, sorts, and actions
- **ARIA Labels:** All charts and tables labeled for screen readers
- **Data Caching:** Cache report data for 5 minutes to reduce API calls
- **Lazy Loading:** Load charts asynchronously to prevent UI blocking
- **Load Time Target:** All reports should load within 3 seconds

---

## End of Document
