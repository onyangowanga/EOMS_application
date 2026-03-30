1. FRONTEND ARCHITECTURE OVERVIEW (React + TypeScript + Vite)
Your stack is already perfect:

React 19 + Vite + TypeScript
Material UI for beautiful mobile-first UI
TanStack Query for smart API caching
Axios with token refresh → stable
React Router v7 for navigation
Nginx for production hosting
Docker for consistent deployment

Now let’s extend this to support your final event logic.

🧱 2. HIGH-LEVEL STRUCTURE
src/
 ├── api/
 │    ├── auth.ts
 │    ├── events.ts
 │    ├── committees.ts
 │    ├── tasks.ts
 │    ├── finance.ts
 │    ├── clusters.ts
 │    ├── approvals.ts
 │    └── users.ts
 │
 ├── components/
 │    ├── layout/
 │    ├── navbar/
 │    ├── forms/
 │    ├── cards/
 │    └── tables/
 │
 ├── context/
 │    └── authContext.tsx
 │
 ├── hooks/
 │    └── useAuth.ts
 │
 ├── pages/
 │    ├── auth/
 │    |     ├── LoginPage.tsx
 │    |     ├── RequestOTP.tsx
 │    |     ├── VerifyOTP.tsx
 │    |     └── SelectOTPMethod.tsx (email/WhatsApp/SMS)
 │    │
 │    ├── dashboard/
 │    |     └── EventDashboard.tsx
 │    │
 │    ├── event/
 │    |     ├── EventSetup.tsx
 │    |     ├── EventOfficials.tsx
 │    |     ├── EventOverview.tsx
 │    |     └── EventProgress.tsx
 │    │
 │    ├── committees/
 │    |     ├── SubcommitteeList.tsx
 │    |     ├── CreateSubcommittee.tsx
 │    |     ├── SubcommitteeDetails.tsx
 │    |     └── SubcommitteeTasks.tsx
 │    │
 │    ├── finance/
 │    |     ├── BudgetOverview.tsx
 │    |     ├── BudgetItems.tsx
 │    |     ├── FinanceApprovals.tsx
 │    |     ├── Requisitions.tsx
 │    |     ├── PaymentLogs.tsx
 │    |     └── TreasurerPage.tsx
 │    │
 │    ├── clusters/
 │    |     ├── ClusterList.tsx
 │    |     ├── ClusterDetails.tsx
 │    |     ├── ClusterReport.tsx
 │    |     └── SubmitToTreasurer.tsx
 │    │
 │    └── reports/
 │          ├── FullEventReport.tsx
 │          └── Summary.tsx
 │
 ├── router/
 │    └── AppRoutes.tsx
 │
 ├── theme/
 │    └── theme.ts
 │
 ├── utils/
 └── main.tsx

This structure supports all event‑level, committee‑level, and finance‑level logic.

📱 3. HOW YOUR FRONTEND SHOULD LOOK (UI WIRE CONCEPT)
Everything shown below is optimized for:

Mobile-first
Clean dashboards
Low cognitive load
Fast information access
Very usable for non‑technical committee members


🟦 4. APP FLOW UI — END-TO-END
🔐 A. Authentication Flow
Page 1 — Enter phone number
User provides:

Phone

Page 2 — Choose verification method

WhatsApp
Email
SMS

Page 3 — Enter OTP

OTP input
Resend options

Page 4 — Onboard

Name
Role (optional for setup)


🟧 B. Event Setup Flow (Admin Only)
1. Create Event
Fields:

Event type (funeral, wedding)
Event title
Event date
Owners (names + phones)

2. Add Core Officials

Chairman
Secretary
Treasurer
Owner(s)

3. Add Main Committee Members
Then event dashboard appears.

🟩 C. Event Dashboard (Main Landing Page)
Top Widgets:

Operational Progress (%)
Financial Progress (%)
Total Budget vs Total Collections
Event Status

Quick Buttons:

Create Subcommittee
View Subcommittees
Finance Center
Clusters & Mobilisation
Reports

Cards:

Subcommittees overview (progress + deadline)
Budget summary
Pending approvals


🟨 D. Subcommittees UI
Subcommittee List Page

List of all subcommittees
Progress bars
Lead Person
Deadline
Budget allocated

Subcommittee Detail
Tabs:

Overview
Tasks
Members
Budget Items
Reporting

Create Task
Fields:

Task title
Description
Deadline
Estimated cost (auto budget entry)
Assigned to (optional)
Progress updates


🟦 E. Budget & Finance UI
1. Budget Overview
Shows:

Total estimated budget
Approved budget
Pending budget items
Subcommittee allocations

2. Budget Items Page
List of budget items:

Description
Amount
Created by
Assigned committee
Approval status
Approval buttons (Chair + Treasurer + Finance Member)

3. Requisitions Page
Subcommittees request funds:

Amount
Purpose
Status (pending, approved, paid)

4. Payments Log
Treasurer logs actual payments.

🟩 F. Funds Mobilisation (Clusters)
Cluster List
Columns:

Cluster Name
Target
Collected
Pledged
Balance
Completion %

Cluster Detail Page
Tabs:

Overview
Daily Reports
Cash in hand
Submissions to Treasurer
Pledges

Cluster Lead Log Submission
Fields:

Amount
Date
Mode
Submitted to Treasurer?

Treasurer Confirms Receipt

Mark as received
Logs transaction in finance module


🟪 G. Reports UI
Event Summary

Financial summary
Operational summary
Cluster progress
Budget usage
Top pending tasks
Overdue items

Export Options:

PDF
Excel
JSON


🟫 5. FRONTEND COMPONENT STRATEGY
Use dedicated UI building blocks:
Global Components:
MobileHeader
BottomNavigation (mobile)
SideMenu (desktop)
EventProgressBar
ClusterCard
TaskCard
SubcommitteeCard
ApprovalButtons
BudgetCard

Reusable Form Components:
PhoneInput
MoneyInput
DatePicker
SelectRole
MemberSelector
CommitteeSelector


🎨 6. DESIGN LANGUAGE (Mobile-first MUI)
Use:

MUI AppBar for header
MUI Drawer for side menu
MUI Cards for summary blocks
MUI Stepper for setup wizard
MUI DataGrid for finance tables
MUI Tabs for subcommittee navigation
MUI SpeedDial for quick actions

Breakpoints:

xs → mobile
sm → tablet
md → desktop


⚙️ 7. STATE MANAGEMENT
You already have TanStack Query.
Perfect.
Use:

React Context only for Auth
TanStack Query for all API data
Zustand (optional) for UI state (drawer, theme, filters)


🚀 8. YOUR FRONTEND WILL FEEL LIKE AN ENTERPRISE APP
With this structure:

Officials manage everything from one dashboard
Subcommittees have organized workflows
Finance has professional approval logic
Cluster mobilisation is well represented
Tasks contribute to event progress
Everything is mobile-friendly