
# EOMS Frontend Pages Structure

This document outlines the **full frontend page architecture** for the EOMS (Events Operations Management System) React Web App. It includes all modules and corresponding pages, grouped logically according to event workflows.

---

# 🏠 1. Authentication Pages

1. **Login / Enter Phone**  
2. **Select OTP Method** (WhatsApp, SMS, Email)  
3. **Verify OTP**  
4. **Onboarding** (first-time user setup)

---

# 🟦 2. Event Setup Pages (Admins Only)

5. **Create Event**  
6. **Assign Core Officials** (Chairman, Secretary, Treasurer, Owners)  
7. **Add Main Committee Members**

---

# 🟩 3. Event Dashboard

8. **Event Dashboard (Home Page)**
- Operational Progress
- Financial Progress
- Subcommittees Overview
- Budget Summary
- Cluster Overview
- Pending Approvals
- Quick Navigation Buttons
- Committee Members Card (new)

8a. **Committee Members Management Page** (NEW)
- View all committee members across all committees
- Add new committee members
- Remove committee members
- Assign members to specific committees
- View member roles and details
- Display statistics (unique members, leads, total memberships)

---

# 🧩 4. Subcommittees Module

9. **Subcommittee List Page**  
10. **Create Subcommittee**  
11. **Subcommittee Details Page** (Overview, Tasks, Members, Reports)  
12. **Subcommittee Tasks Page**  
13. **Create/Update Task Page**

---

# 🟧 5. Budget & Finance Module

14. **Budget Overview Page**  
15. **Budget Items Page** (Approvals included)  
16. **Finance Approvals Page**  
17. **Requisitions Page**  
18. **Payment Logs Page (Treasurer)**

---

# 🟫 6. Funds Mobilisation (Clusters)

19. **Cluster List Page**  
20. **Create Cluster Page**  
21. **Cluster Details Page** (Overview, Daily Reports, Members, Pledges)  
22. **Submit Funds to Treasurer (Cluster Lead)**  
23. **Treasurer Confirmation Page**

---

# 🟪 7. Approvals Module

24. **Approval Center**
- Budget Approvals
- Requisition Approvals
- Payments
- Cluster Submissions

---

# 📊 8. Reports Module

25. **Event Summary Report**  
26. **Financial Report**  
27. **Subcommittee Reports**  
28. **Download Reports Page** (PDF/Excel/JSON)

---

# 👤 9. User Account Module

29. **My Profile**  
30. **Notifications Center**  
31. **Settings Page** (preferred OTP method, name, email)

---

# 🟦 10. Admin Pages

32. **Manage Users**  
33. **Manage Committees**  
34. **Event Settings** (archive, update, finalize)

---

# 📌 Summary of Total Pages

You will have a total of **35 pages**, grouped as follows:

- Authentication: 4
- Event Setup: 3
- Dashboard: 2 (Dashboard + Committee Members)
- Subcommittees: 5
- Tasks: 2
- Budget & Finance: 5
- Mobilisation: 5
- Approvals: 1
- Reports: 4
- User: 3
- Admin: 3

---

# 🚀 This file defines the full frontend sitemap for EOMS

Use this as the foundation for your React Router setup, sidebar navigation, and page scaffolding.

