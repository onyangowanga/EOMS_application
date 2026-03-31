
# Operational Progress Engine Specification (EOMS)

This document defines the Operational Progress Engine for the Events Operations Management System (EOMS). It explains how progress is computed at task, subcommittee, and event levels, and it outlines the expected UI and API behavior.

## 1. Purpose

The Operational Progress Engine answers one core question:

> How far along is event execution right now?

It provides:
- Task-level progress and risk state
- Subcommittee-level weighted progress
- Event-level operational progress
- Automatic risk indicators (overdue, blocked, behind schedule, understaffed)
- Dashboard alerts for leadership and committees

Primary consumers:
- Event Dashboard operational KPI
- Subcommittee progress cards
- Task risk indicators
- Alerts and notifications panels

## 2. Task-Level Progress Logic

Each task has:
- `progress` on a scale of 0 to 100
- `status` from a controlled set
- `deadline` (date)

Recommended status model:
- `todo` (0%)
- `in_progress` (10-80%)
- `ready_for_review` (~90%)
- `blocked` (progress retained)
- `completed` (100%)

Example:

```json
{
  "task_id": 12,
  "progress": 40,
  "status": "in_progress",
  "deadline": "2026-04-01"
}
```

Task rules:
- Overdue: `deadline < today AND status != completed`
- Blocked: does not reset progress, but always contributes a risk flag

Normalization rule:
- Clamp all task progress values to the range `[0, 100]` before aggregation

## 3. Subcommittee Progress Calculation

Subcommittee progress is a weighted average of task progress.

Default weights:
- Completed: `1.0`
- In progress: `1.0`
- Blocked: `0.7`
- Overdue (not completed): `0.5`

Formula:

```text
weighted_subcommittee_progress =
  sum(task_progress * task_weight) / sum(task_weight)
```

Edge case:
- If a subcommittee has zero tasks, return progress `0` and risk state `no_tasks`

## 4. Event Operational Progress Calculation

Event progress is a weighted average of subcommittee progress by task volume.

Formula:

```text
event_operational_progress =
  sum(subcommittee_progress * subcommittee_task_count) /
  sum(subcommittee_task_count)
```

Why this works:
- Subcommittees with more active workload have proportionate influence
- Very small committees do not distort the event-level metric

Edge case:
- If total task count across all subcommittees is zero, return progress `0`

## 5. Risk Indicators and Alerts

The engine should detect and emit alerts for:

1. Overdue tasks
1. Blocked tasks
1. Subcommittees behind schedule
1. Understaffed subcommittees

Behind schedule rule:

```text
(days_elapsed / total_event_days) > (subcommittee_progress / 100)
```

Understaffed examples:
- No lead assigned
- Member count below configured threshold for current workload

Severity recommendations:
- Critical: overdue tasks, no lead assigned
- Warning: blocked tasks, behind schedule
- Info: no tasks available yet

## 6. UI Requirements

### 6.1 Event Dashboard Operational KPI
- Circular progress indicator
- Numeric percentage label
- Color thresholds:
  - Green: `> 70%`
  - Yellow: `40% to 70%`
  - Red: `< 40%`

### 6.2 Subcommittee Overview Grid
Each card should show:
- Progress bar
- Total task count
- Completed count
- Overdue count
- At-risk marker

### 6.3 Subcommittee Details Overview
Show:
- Progress bar and percentage
- Totals (tasks, completed, blocked, overdue)
- Timeline risk indicator
- Most recent alerts

### 6.4 Alerts Section
Show grouped alerts for:
- Overdue tasks
- Blocked tasks
- Subcommittees behind schedule
- Subcommittees without leads

## 7. API Contract

### 7.1 Get Event Operational Summary

```http
GET /api/events/:eventId/operational-summary
```

Response shape (percentages in `0-100` scale):

```json
{
  "event_progress": 54,
  "subcommittees": [
    {
      "id": 1,
      "name": "Transport",
      "progress": 71,
      "task_count": 14,
      "tasks": {
        "total": 14,
        "completed": 8,
        "overdue": 1,
        "blocked": 2
      },
      "risk_state": "warning"
    }
  ],
  "alerts": [
    {
      "type": "overdue_task",
      "severity": "critical",
      "message": "Transport has 1 overdue task"
    },
    {
      "type": "missing_lead",
      "severity": "critical",
      "message": "Media committee has no lead assigned"
    }
  ],
  "generated_at": "2026-03-30T10:30:00Z"
}
```

### 7.2 Get Subcommittee Progress

```http
GET /api/subcommittees/:id/progress
```

### 7.3 Get Task Risk

```http
GET /api/tasks/:id/risk
```

## 8. Backend Processing Summary

Backend responsibilities:
1. Fetch subcommittees for the event
1. Fetch tasks per subcommittee
1. Compute task risk flags
1. Compute weighted subcommittee progress
1. Compute weighted event progress
1. Generate normalized alerts
1. Return dashboard payload

Caching recommendation:
- Cache summary response for 15 to 30 seconds
- Invalidate cache on task create, update, status change, or reassignment

## 9. Frontend Components

Recommended components:
- `<OperationalProgressWidget />`
- `<SubcommitteeProgressCard />`
- `<TaskProgressBar />`
- `<TaskStatusChip />`
- `<OperationalAlerts />`
- `<EventTimelineProgress />`

## 10. Implementation Notes

- Keep a single percentage scale (`0-100`) across backend and frontend
- Keep status values enum-based to avoid string drift
- Emit structured alerts (`type`, `severity`, `message`) instead of plain text only
- Track `generated_at` in summary responses for freshness and debugging
