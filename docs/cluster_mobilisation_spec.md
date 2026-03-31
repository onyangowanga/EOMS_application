
# Cluster Mobilisation Module Specification (EOMS)

This document defines the operational workflow, data structures, and UI specifications for the **Cluster Mobilisation Module** in EOMS.

---

# 🎯 Purpose of Cluster Mobilisation
Clusters are fundraising groups responsible for:
- Mobilising funds
- Collecting contributions
- Recording pledges
- Submitting collected funds to the Treasurer
- Reporting daily progress

Clusters are part of the Mobilisation Committee.

---

# 🧩 Cluster Responsibilities
- Collect funds from various contributors
- Track pledges and fulfilled amounts
- Maintain cluster‑level ledgers
- Submit funds to the Treasurer
- Monitor progress toward cluster target

---

# 🧾 Data Model (Clusters)

## **Cluster**
```
id
event_id
name
target_amount
lead_id
```

## **ClusterMember**
```
id
cluster_id
name
phone
role (lead/member)
```

## **ClusterCollection**
```
id
cluster_id
amount
source
is_pledge
received_by_lead
submitted_to_treasurer
submitted_date
treasurer_confirmed
confirmed_date
```

---

# 🔄 Cluster Workflows

## Workflow 1: Creating a Cluster
1. Mobilisation or finance team creates cluster
2. Assign cluster lead
3. Set target amount
4. Add members (optional)

## Workflow 2: Collecting Money
Cluster lead logs:
- Amount
- Contributor name
- Mode (cash/mpesa/bank)
- Pledge or actual

## Workflow 3: Submitting Money to Treasurer
1. Lead opens “Submit Funds to Treasurer”
2. Enters amount & mode
3. Treasurer receives & confirms
4. Updates event budget

## Workflow 4: Daily Progress Reporting
Cluster dashboard shows:
- Target vs collected
- Pledges vs fulfilled
- Submission history
- Unsubmitted funds
- Progress %

---

# 🖥️ Cluster UI Specifications

## **1. Cluster List Page**
Columns:
- Name
- Lead
- Target
- Collected
- Pledges
- Progress %

## **2. Cluster Details Page**
Tabs:
- Overview
- Collections
- Pledges
- Submissions
- Members

### Overview Tab
- Target
- Collected
- Balance
- Progress bar

### Collections Tab
- List of contributions
- Mode
- Contributor info

### Pledges Tab
- Pledge list
- Fulfillment status

### Submissions Tab
- Funds submitted to treasurer
- Treasurer confirmation status

### Members Tab
- Member list
- Roles
- Add/remove members

---

# 🔗 Treasury ↔ Cluster Interaction
```
ClusterCollection → Submission → TreasurerConfirmation → TreasuryIncome
```

Treasurer updates:
- Cluster progress
- Event total collections
- Real‑time financial transparency

---

# ✔ End of Document
