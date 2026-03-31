
# Treasury Module Specification (EOMS)

This document defines the complete **Treasury Module** workflow, data structures, and UI specifications for the EOMS (Events Operations Management System). It is optimized for GitHub Copilot to implement clean frontend and backend features.

---

# 🎯 Purpose of the Treasury Module
The Treasurer handles all **incoming funds**, **payment execution**, and **financial confirmations**.

The Treasury Module is responsible for:
- Confirming cluster submissions
- Recording general contributions
- Viewing & approving payment requisitions
- Executing payments
- Maintaining cash, M-Pesa, and bank balances
- Providing an auditable financial trail

It operates under:
```
Event Dashboard → Finance Module → Treasury
```

---

# 🧩 Treasury Responsibilities

## ✔ Receiving Funds
Treasurer receives money from:
- Cluster leaders
- General contributors
- Pledges fulfilled
- Event owners
- Church/Sacco/Friends groups

## ✔ Confirming Cluster Submissions
Cluster lead submits → Treasurer verifies → Confirms.

## ✔ Executing Payments
Payments are executed only after 3-level approval:
- Chairman
- Treasurer
- Finance Committee Member

Treasurer logs:
- Amount paid
- Mode of payment
- Receipt proof
- Notes

## ✔ Maintaining Cash Position
Treasurer tracks:
- Cash on hand
- M-Pesa till balance
- Bank balance

## ✔ Audit Trail
Every income and expense is logged.

---

# 🧾 Data Model (Treasury)

## **TreasuryIncome**
```
id
event_id
cluster_id (nullable)
source_type (cluster/general/pledge)
amount
received_from
received_by (treasurer)
date_received
confirmation_status
```

## **Payment**
```
id
requisition_id
amount_paid
paid_by
date_paid
payment_method
receipt_url
```

## **TreasuryBalance**
```
event_id
cash_on_hand
mpesa_balance
bank_balance
```

---

# 🔄 Treasury Workflows

## Workflow 1: Receiving Funds From Clusters
1. Cluster Lead → “Submit to Treasurer”
2. Treasurer verifies amount
3. Treasurer confirms
4. TreasuryIncome logged
5. Cluster progress updated

## Workflow 2: Receiving General Contributions
Treasurer manually enters:
- Source name
- Amount
- Mode (cash/mpesa/bank)
- Notes

## Workflow 3: Executing Payments
1. Requisition approved by 3 parties
2. Treasurer pays
3. Logs details
4. Payment updates event budget

---

# 🖥️ Treasury Pages (UI Specs)

## **1. Treasury Dashboard**
Displays:
- Cash on hand
- M-Pesa balance
- Bank balance
- Total collected
- Total spent
- Pending requisitions
- Cluster submissions

Charts:
- Pie: sources of funds
- Line: daily collections

## **2. Incoming Funds Page**
Tabs:
- Cluster submissions
- General contributions
- Pledges

Columns:
- Source
- Amount
- Mode
- Confirmed?
- Action

## **3. Payments Page**
Tabs:
- Pending payments
- Paid
- Rejected

Columns:
- Budget item
- Amount
- Requisition details
- Approval chain
- Receipt

## **4. Ledger Page**
Shows all transactions (income + expense).
Exportable to CSV.

---

# ✔ End of Document
