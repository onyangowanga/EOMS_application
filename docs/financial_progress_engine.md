
# Financial Progress Engine Specification (EOMS)

This document defines the complete **Financial Progress Engine** for the Events Operations Management System (EOMS). It explains how financial progress is calculated, how income and expenses move through the system, how subcommittee allocations and budget items affect event-wide financial health, and what UI + backend components are required.

It is optimized for GitHub Copilot when implementing the React + TypeScript frontend and Django backend.

---

# 🎯 1. Purpose of the Financial Progress Engine

The Financial Progress Engine answers the question:
> “How far along is the event financially compared to the planned budget?”

It calculates and displays:
- Total funds collected
- Total funds spent
- Budget approvals vs pending
- Remaining funds
- Financial progress (% complete)
- Budget utilization per subcommittee
- Real-time treasury balances
- Cluster mobilisation progress (financial side)

This engine powers:
- Event Dashboard → **Financial Progress KPI**
- Finance Module → Budget Dashboard
- Reports Page → Finance Tab
- Subcommittee Budget Tabs

---

# 🧮 2. Core Financial Metrics

These are the 7 primary metrics the engine computes:

### **1. Total Estimated Budget**
```
Sum of all Budget Items (Approved + Pending)
```

### **2. Approved Budget**
```
Sum of all APPROVED Budget Items
```

### **3. Pending Budget Items**
```
Sum of all PENDING Budget Items
```

### **4. Total Funds Collected**
Includes:
- Cluster confirmed submissions
- Direct contributions
- General income
```
Sum(TreasuryIncome.amount where confirmed=true)
```

### **5. Total Funds Spent**
```
Sum(Payments.amount_paid)
```

### **6. Remaining Budget**
```
Remaining = Approved Budget - Total Funds Spent
```

### **7. Financial Progress %**
Financial Progress is the ratio of **actual spending** to **approved budget**, not estimated budget.
```
financial_progress = (Total Funds Spent / Approved Budget)
```
If Approved Budget = 0 → progress defaults to 0%.

---

# 🌐 3. Additional Derived Metrics

### **Budget Variance**
Difference between estimated and actual spending:
```
Variance = Estimated Budget - Total Funds Spent
```

### **Subcommittee Utilization**
```
utilization = (Subcommittee.amount_spent / Subcommittee.allocated_budget)
```

### **Cash Position**
```
Cash = cash_on_hand + mpesa_balance + bank_balance
```

### **Cluster Mobilisation Financial Progress**
```
cluster_progress = (Cluster.collected / Cluster.target)
```

### **Funds Deficit / Surplus**
```
SurplusOrDeficit = Total Funds Collected - Total Funds Spent
```

---

# 💰 4. Financial Workflow Logic

Below is the complete financial pipeline:

## **Step 1: Budget Items Created**
- Created automatically from Tasks (if estimated_cost provided)
- Created manually by Finance Team
- Status defaults to **Pending**

## **Step 2: Budget Approval Chain**
A Budget Item requires:
- Chairman Approval
- Treasurer Approval
- Finance Committee Member Approval

Once all approve → **Approved Budget Item**

## **Step 3: Requisition (Request for Funds)**
Only allowed for **Approved** items.

Requisition includes:
- Requested Amount
- Purpose
- Needed By Date
- Subcommittee

## **Step 4: Requisition Approval Chain**
Same 3-level approval.

If approved → Treasurer sees “Pending Payment”.

## **Step 5: Payment Execution**
Treasurer pays:
- Cash
- M-Pesa
- Bank

Logs:
- Amount Paid
- Payment Method
- Receipt

## **Step 6: Ledger & Dashboard Update**
Recorded in:
- Payments Ledger
- Finance Summary
- Event Dashboard
- Reports

---

# 📉 5. Financial Progress Calculation Engine

### **Event-Level Financial Progress**
```
progress = Total Funds Spent / Approved Budget
```
Displayed as:
- KPI widget on dashboard
- Circular indicator
- Color-coded state

### **Color Coding:**
- **Green (>70%)** = Good progress / well funded
- **Yellow (40%–70%)** = Moderate
- **Red (<40%)** = Underfunded / behind

---

# 🏛 6. Financial Risk Indicators & Alerts

The engine generates alerts for:

### **Budget Overrun Risk**
```
Total Funds Spent > Approved Budget
```

### **High Pending Budget**
Pending Budget Items > 30% of total budget.

### **Insufficient Funds**
```
Total Funds Collected < Approved Budget
```

### **Cluster Behind Target**
Any cluster progress < expected progress per timeline.

### **Large Outstanding Requisitions**
Requisitions pending approval for >48 hours.

---

# 🎨 7. UI Requirements (Frontend)

## Event Dashboard → **Financial Progress KPI Widget**
Shows:
- Progress circle
- Approved budget
- Funds collected
- Funds spent
- Remaining funds

## Finance Module → **Budget Dashboard**
- Estimated vs Approved vs Spent
- Trend chart
- Subcommittee budget usage bars
- Pending approvals list

## Subcommittee Details → **Budget Tab**
- Allocation
- Budget Items
- Utilization bar

## Reports Page → **Finance Tab**
- Income ledger
- Expense ledger
- Financial charts
- Variance reports

---

# 📡 8. API Endpoints Required

### **GET Event Financial Summary**
```
GET /api/events/:eventId/financial-summary
```

### **GET Budget Summary**
```
GET /api/events/:eventId/budget-summary
```

### **GET Cluster Financial Summary**
```
GET /api/events/:eventId/clusters/financial-summary
```

### **GET Subcommittee Financial Summary**
```
GET /api/subcommittees/:id/financial-summary
```

### **GET Income Ledger**
```
GET /api/events/:id/ledger/income
```

### **GET Expense Ledger**
```
GET /api/events/:id/ledger/expenses
```

---

# 🧮 9. Backend Calculation Logic Summary

The backend must:
- Aggregate all approved budget items
- Sum all pending budget items
- Sum all income (confirmed)
- Sum all expenses (paid)
- Compute weighted metrics
- Compute cluster mobilisation financial progress
- Detect all risk conditions

Should be cached for 15–30 seconds.

---

# ✔ End of Document
