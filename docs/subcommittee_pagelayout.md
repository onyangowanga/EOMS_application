
# Subcommittee Page Layout Instructions for Copilot

This document provides a complete specification for building the **Subcommittee Details Page** in the EOMS React Web Application. It is designed as *context for GitHub Copilot* so it can generate accurate and consistent code.

---

# 🎯 Purpose of This Page
The **Subcommittee Details Page** displays and manages everything related to a single subcommittee within an event. It enables:
- Viewing subcommittee information
- Managing members
- Managing tasks
- Tracking progress
- Managing budget-related items
- Viewing reports and analytics

It must be **mobile-first**, clean, and usable by non-technical committee members.

---

# 🧭 Route Definition
```
/event/:eventId/subcommittees/:subcommitteeId
```

---

# 🧱 Page Layout Structure
```
----------------------------------------------------
| Subcommittee Title (Header)                       |
| Lead: <name> | Deadline: <date>                   |
| Operational Progress Bar                          |
----------------------------------------------------
| Tabs: Overview | Tasks | Members | Budget | Reports|
----------------------------------------------------
| Dynamic Tab Content                               |
----------------------------------------------------
| Floating Action Button (Context Aware)            |
----------------------------------------------------
```

---

# 📑 Tabs Breakdown

## 1. Overview Tab
Shows high-level information about the subcommittee.

### Components:
- Subcommittee name
- Lead name + phone
- Deadline
- Description
- Key deliverables
- Operational progress bar
- Cards showing:
  - Number of tasks
  - Task completion %
  - Budget allocated
  - Budget used

### Actions:
- Edit subcommittee info
- Change lead
- Edit deadline
- Edit deliverables

---

## 2. Tasks Tab
Displays all tasks assigned to the subcommittee.

### Components:
- List of tasks
- Filters:
  - Status (todo, in-progress, blocked, done)
  - Assigned to
  - Deadline

### Task Card Includes:
- Task title
- Progress (percentage slider)
- Assignee
- Deadline
- Estimated cost (which creates a budget item)

### Actions:
- Create task (FAB)
- Edit task
- Update progress
- Reassign task

---

## 3. Members Tab
Shows and manages subcommittee members.

### Components:
- List of members
- Member chips/cards: name + phone + role
- Button: "Add Member"

### Add Member Modal:
- Select from event members
- Assign role: Member or Subcommittee Lead

### Actions:
- Add member
- Remove member
- Promote member to lead

---

## 4. Budget Tab
Shows all budget items tied to this subcommittee.

### Components:
- Budget allocated
- Budget used
- Remaining balance
- List of budget-impact items

### Budget Item Card Includes:
- Title
- Amount
- Status (Pending/Approved/Rejected)
- Created by
- Approval progress

### Actions:
- Create manual budget item
- View approval chain

---

## 5. Reports Tab
Reports tab shows analytics and performance data.

### Components:
- Task completion chart
- Budget usage chart
- Upcoming deadlines
- Overdue tasks
- Export buttons (PDF/CSV)

---

# ⚙️ API Endpoints (Frontend Expected)
Copilot should integrate with the following expected backend endpoints:

### Subcommittee Details
```
GET /api/events/:eventId/subcommittees/:subcommitteeId/
```

### Subcommittee Tasks
```
GET /api/subcommittees/:id/tasks/
POST /api/subcommittees/:id/tasks/
PATCH /api/tasks/:taskId/
```

### Subcommittee Members
```
GET /api/subcommittees/:id/members/
POST /api/subcommittees/:id/members/
DELETE /api/subcommittee-members/:membershipId/
```

### Budget
```
GET /api/subcommittees/:id/budget-items/
POST /api/subcommittees/:id/budget-items/
```

---

# 🎨 UI Components Needed
- **SubcommitteeHeader**
- **TabNavigation**
- **ProgressBar**
- **TaskCard**
- **MemberCard**
- **BudgetItemCard**
- **Charts** (Reports)
- **FAB (Floating Action Button)**
- **Modals:**
  - AddTaskModal
  - AddMemberModal
  - CreateBudgetItemModal

---

# 🚀 Copilot Build Instructions Summary (Paste into VS Code)

> Build a React page named `SubcommitteeDetailsPage` using TypeScript, Material UI, TanStack Query, and Axios. It should include 5 tabs: Overview, Tasks, Members, Budget, and Reports. The header must show subcommittee name, lead, deadline, and a progress bar. Each tab contains its functional components as defined above. Include FAB for context-aware actions (e.g., create task, add member). Ensure the page is mobile-first. Fetch all data from the provided API endpoints.

---

# End of Document
