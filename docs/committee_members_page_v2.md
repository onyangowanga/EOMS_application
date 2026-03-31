
# Committee Members Page Specification (EOMS)

This document defines the complete and polished **Committee Members Page** for the Events Operations Management System (EOMS). It includes layout, workflows, UI components, and API expectations. It is optimized for GitHub Copilot when building the React + TypeScript frontend.

---

# 🎯 Purpose of the Committee Members Page

The Committee Members Page manages all **event-level members** (umbrella committee). It allows:
- Adding new event members
- Managing roles and privileges
- Assigning members to subcommittees
- Viewing member participation and workload
- Providing a full directory of people involved in the event

Route:
```
/event/:eventId/members
```

---

# 🧱 Page Structure (Mobile-first)
```
---------------------------------------------------------
| Header: Committee Members                              |
---------------------------------------------------------
| Search Bar + Filter Bar                                |
---------------------------------------------------------
| Members Grid (cards on mobile, table on desktop)       |
---------------------------------------------------------
| Floating Action Button: Add Member                     |
---------------------------------------------------------
| Slide-over Modal: Member Profile                       |
---------------------------------------------------------
```

---

# ⭐ 1. Member Cards / Table Layout

### MemberCard shows:
- Avatar (initials)
- Full name
- Phone number
- Role (Chair, Treasurer, Member, etc.)
- Privilege chips:
  - Finance Committee
  - Budget Committee
  - Cluster Lead
  - Subcommittee Lead

### Attached metrics:
- Tasks assigned
- Tasks completed
- Subcommittees assigned

### Buttons per card:
- **View Profile**
- **Assign to Subcommittee**
- **Edit Member**
- **Remove Member**

Desktop → Table view.
Mobile → Card grid view.

---

# ⭐ 2. Adding a Member

**Add Member Modal Fields:**
- Full Name
- Phone Number (E.164 format, login identity)
- Event Role:
  - Chair
  - Secretary
  - Treasurer
  - Committee Member
  - Finance Member
  - Budget Committee Member
  - Mobilisation Team Member
- Optional: Assign to subcommittees immediately

### Validation:
- Phone number must be unique
- Name required
- At least one event role

### On Submit:
- Creates User account
- Adds to event’s umbrella committee
- Optionally sends welcome OTP (if enabled)

---

# ⭐ 3. Member Profile Drawer
Opens when clicking a member.
Displays:
- Name
- Phone
- Event-level roles
- Subcommittees
- Cluster role (if any)
- Task stats

Actions:
- Edit Member
- Reassign Roles
- Assign/Remove from Subcommittees
- Remove from Event

---

# ⭐ 4. Assign Member to Subcommittee

“Assign to Subcommittee” opens a modal:
- Dropdown: Choose Subcommittee
- Role: Lead or Member
- Optional: assign to multiple committees

### Saves into:
```
subcommittee_members
```

---

# ⭐ 5. Edit Member Modal
Editable fields:
- Full name
- Phone
- Roles
- Privileges

Non-editable:
- Event ID
- Member ID

---

# ⭐ 6. Removing a Member

### On removal:
- Confirm modal
- Optional reason (for audit logs)
- Remove from:
  - Umbrella committee
  - All subcommittees
  - Cluster leadership

User account is not deleted (may be reused later).

---

# ⭐ 7. Search & Filter System

Filters:
- Role (Chair, Treasurer, etc.)
- Privileges (Finance, Budget, Mobilisation)
- Committee assignment

Search matches:
- Name
- Phone

---

# ⭐ 8. Participation & Workload Metrics

Each MemberCard or Profile shows:
- Tasks assigned
- Tasks completed
- Subcommittee count
- Activity indicator

Useful for management and post-event analysis.

---

# 🧩 UI Components Needed
- <MemberCard />
- <MembersTable />
- <AddMemberModal />
- <EditMemberModal />
- <MemberProfileDrawer />
- <AssignToSubcommitteeModal />
- <PrivilegeChips />
- <MemberSearchFilter />
- <RoleSelector />

---

# 📡 API Endpoints Required
```
GET /api/events/:id/members
POST /api/events/:id/members
PATCH /api/event-members/:memberId
DELETE /api/event-members/:memberId
POST /api/subcommittees/:id/members
```

Each operation updates member assignments, roles, and permissions.

---

# ✔ End of Document
