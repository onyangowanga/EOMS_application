
# RBAC (Role-Based Access Control) Engine Specification — EOMS

This document defines the complete **Role-Based Access Control (RBAC)** architecture for the Events Operations Management System (EOMS). It outlines the role model, permission rules, backend enforcement, frontend route guarding, and token structure. It is optimized for GitHub Copilot to implement in a Django backend and React + TypeScript frontend.

---

# 🎯 1. Purpose of the RBAC Engine

The RBAC engine controls **who can access what**, ensuring that:
- Executive leaders retain governance oversight
- Finance committee members handle financial approvals
- Subcommittee leads manage tasks and operations
- Treasurer manages payments & confirmations
- Cluster leads manage mobilisation only
- Regular members access only relevant functions

RBAC ensures **security, transparency, and clean separation of duties** across the entire event.

---

# 🧩 2. Role Model (Final EOMS Role List)

## **Event-Level Roles**
These roles apply across the entire event:
- **chair**
- **secretary**
- **treasurer**
- **finance_member**
- **budget_member**
- **mobilisation_member**
- **committee_member**
- **executive_admin** (optional system-wide superuser)

## **Subcommittee-Level Roles**
- **subcommittee_lead**
- **subcommittee_member**

## **Cluster Roles**
- **cluster_lead**
- **cluster_member**

Users may have multiple roles simultaneously.

---

# 🏛 3. Permission Matrix

This table defines what each role is allowed to do:

| ACTION | CHAIR | SECRETARY | TREASURER | FINANCE MEMBER | SUBCOMMITTEE LEAD | MEMBER | CLUSTER LEAD |
|--------|--------|-----------|-----------|-----------------|--------------------|--------|--------------|
| View Event Dashboard | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Manage Event Settings | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Access Finance Module | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ |
| Approve Budget Items | ✔ | ✖ | ✔ | ✔ | ✖ | ✖ | ✖ |
| Approve Requisitions | ✔ | ✖ | ✔ | ✔ | ✖ | ✖ | ✖ |
| Execute Payments | ✖ | ✖ | ✔ | ✖ | ✖ | ✖ | ✖ |
| Manage Subcommittees | ✔ | ✔ | ✖ | ✖ | ✔ (own) | ✖ | ✖ |
| Create Tasks | ✔ | ✔ | ✖ | ✖ | ✔ | ✖ | ✖ |
| Update Task Progress | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ |
| Manage Members | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Manage Clusters | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✔ (own cluster) |

---

# 🏗 4. Backend Implementation (Django)

## **A. Add `roles` field to User model**
```python
roles = models.JSONField(default=list)
```

## **B. Role Enforcement Decorator**
```python
from rest_framework.response import Response
from rest_framework import status

def require_roles(*required):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            user_roles = request.user.roles or []
            if any(role in user_roles for role in required):
                return view_func(request, *args, **kwargs)
            return Response({"detail": "Permission denied"}, status=403)
        return wrapper
    return decorator
```

## **C. Usage Example:**
```python
@require_roles("chair", "treasurer", "finance_member")
def approve_budget_item(...):
    ...
```

---

# 🔐 5. JWT Token Structure (After OTP Login)

Upon successful authentication:
```json
{
  "access": "...",
  "refresh": "...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "phone": "+2547...",
    "roles": ["subcommittee_lead", "finance_member"],
    "subcommittee_roles": {
      "transport": "lead",
      "media": "member"
    },
    "cluster_roles": {
      "cluster_1": "lead"
    }
  }
}
```

---

# 🖥 6. Frontend RBAC (React + TypeScript)

## **A. Add `hasRole` helper in Auth Context**
```ts
const hasRole = (roles: string | string[]) => {
  if (!user) return false;
  const needed = Array.isArray(roles) ? roles : [roles];
  return needed.some(r => user.roles.includes(r));
};
```

## **B. Route Protection**
```tsx
<Route
  path="/finance"
  element={hasRole(["chair", "treasurer", "finance_member"]) ? (
    <FinanceDashboard />
  ) : (
    <NotAuthorized />
  )}
/>
```

## **C. Hide/Show UI Elements**
```tsx
{hasRole(["chair", "secretary"]) && (
  <Button>Create Subcommittee</Button>
)}
```

---

# 🧩 7. Subcommittee-Level RBAC

Each assignment in `subcommittee_members` table generates:
```json
"subcommittee_roles": {
  "transport": "lead",
  "catering": "member"
}
```

Frontend check:
```ts
user.subcommittee_roles[subcommitteeId] === "lead"
```

---

# 🟦 8. Cluster-Level RBAC

Cluster members table produces:
```json
"cluster_roles": {
  "cluster_7": "lead"
}
```

Frontend check:
```ts
if (user.cluster_roles[clusterId] === "lead") showSubmitFundsButton();
```

---

# 🧨 9. Super Admin Logic

Add global override:
```ts
hasRole("executive_admin") → always true
```

Useful for development & emergency access.

---

# 📝 10. Summary of RBAC Features

✔ Multi-role support per user  
✔ Event-wide, subcommittee-wide, and cluster-wide permission layers  
✔ Backend endpoint enforcement  
✔ Frontend route guarding  
✔ Dynamic UI visibility rules  
✔ JWT-driven authorization  
✔ Clean separation of governance vs operational roles  
✔ Supports all EOMS modules (Finance, Tasks, Clusters, Approvals, Dashboard)  

RBAC is now **enterprise-ready**, scalable, and perfectly integrated into the EOMS architecture.

---

# ✔ End of Document
