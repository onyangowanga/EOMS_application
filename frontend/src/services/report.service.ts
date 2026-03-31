import apiClient from './api';
import type {
  CommitteeReport,
  SummaryReportData,
  OperationsReportData,
  FinanceReportData,
  ClusterReportData,
  MemberReportData,
} from '../types/index';

const toNumber = (value: unknown): number => {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
  return Number.isFinite(num) ? num : 0;
};

const toDateOnly = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const withReportDates = (startDate?: string, endDate?: string) => ({
  ...(startDate ? { start_date: startDate } : {}),
  ...(endDate ? { end_date: endDate } : {}),
});

const normalizeSummaryReport = (eventId: string, raw: any): SummaryReportData => {
  const tasksCompleted = raw?.kpis?.tasks_completed;
  const fundsCollected = raw?.kpis?.funds_collected;
  const overallProgress = raw?.kpis?.event_progress;
  const totalFundsCollected = toNumber(fundsCollected?.value);
  const totalBudgetEstimate = toNumber(fundsCollected?.total);
  const remaining = Math.max(totalBudgetEstimate - totalFundsCollected, 0);

  return {
    event_id: String(eventId),
    event_name: raw?.event_details?.name ?? 'Event',
    report_date: new Date().toISOString(),
    kpis: {
      operational_progress: {
        label: 'Operational Progress',
        value: toNumber(overallProgress?.value),
        unit: '%',
        color: 'warning',
      },
      financial_progress: {
        label: 'Financial Progress',
        value: toNumber(fundsCollected?.percentage),
        unit: '%',
        color: 'primary',
      },
      total_funds_collected: {
        label: 'Total Funds Collected',
        value: totalFundsCollected,
        color: 'success',
      },
      total_funds_spent: {
        label: 'Total Funds Spent',
        value: 0,
        color: 'warning',
      },
      total_budget_estimate: {
        label: 'Total Budget Estimate',
        value: totalBudgetEstimate,
        color: 'info',
      },
      remaining_budget: {
        label: 'Remaining Budget',
        value: remaining,
        color: 'info',
      },
      tasks_completed: {
        label: 'Tasks Completed',
        value: toNumber(tasksCompleted?.value),
        color: 'success',
      },
      mobilization_progress: {
        label: 'Mobilization Progress',
        value: toNumber(fundsCollected?.percentage),
        unit: '%',
        color: 'primary',
      },
    },
    charts: {
      daily_collections: [],
      subcommittee_progress: [],
      expense_distribution: raw?.task_status_chart ?? [],
    },
    tables: {
      overdue_tasks: (raw?.overdue_tasks ?? []).map((task: any) => ({
        ...task,
        id: String(task.id),
        status: task.status ?? 'TODO',
        progress_percentage: task.status === 'COMPLETED' ? 100 : 0,
        is_overdue: toNumber(task.days_remaining) < 0,
      })),
      largest_expenses: [],
      latest_contributions: [],
      pending_approvals: [],
    },
  };
};

const normalizeOperationsReport = (eventId: string, raw: any): OperationsReportData => {
  const subcommitteePerformance = (raw?.subcommittee_performance ?? []).map((committee: any) => {
    const progress = toNumber(committee.completion_rate);
    const status = progress >= 70 ? 'ON_TRACK' : progress >= 40 ? 'AT_RISK' : 'CRITICAL';
    return {
      ...committee,
      id: String(committee.id),
      blocked_tasks: 0,
      overdue_tasks: toNumber(committee.overdue_count),
      progress_percentage: progress,
      status,
      tasks_completed_rate: `${progress.toFixed(1)}%`,
      average_task_progress: `${progress.toFixed(1)}%`,
    };
  });

  const taskBreakdown = (raw?.recent_tasks ?? []).map((task: any) => ({
    ...task,
    id: String(task.id),
    status: task.status ?? 'TODO',
    progress_percentage: toNumber(task.completion_percentage),
    is_overdue: toNumber(task.days_remaining) < 0,
  }));

  return {
    event_id: String(eventId),
    event_name: 'Event',
    report_date: new Date().toISOString(),
    subcommittee_performance: subcommitteePerformance,
    task_breakdown: taskBreakdown,
    charts: {
      tasks_by_status: [
        { label: 'Completed', value: toNumber(raw?.totals?.completed) },
        { label: 'In Progress', value: toNumber(raw?.totals?.in_progress) },
        { label: 'Pending', value: toNumber(raw?.totals?.pending) },
        { label: 'Overdue', value: toNumber(raw?.totals?.overdue) },
      ],
      subcommittee_progress: subcommitteePerformance.map((committee: any) => ({
        label: committee.name,
        value: toNumber(committee.progress_percentage),
      })),
      tasks_over_time: (raw?.priority_breakdown ?? []).map((item: any) => ({
        label: item.label,
        value: toNumber(item.value),
      })),
    },
  };
};

const normalizeFinanceReport = (eventId: string, raw: any): FinanceReportData => {
  const summary = raw?.summary ?? {};
  const income = toNumber(summary.total_income);
  const expense = toNumber(summary.total_expense);
  const totalBudget = toNumber(summary.total_budget);

  return {
    event_id: String(eventId),
    event_name: 'Event',
    report_date: new Date().toISOString(),
    budget_overview: {
      total_estimated_budget: String(totalBudget),
      approved_budget: String(totalBudget),
      pending_budget_items_count: 0,
      pending_budget_items_amount: '0',
      used_budget_paid: String(expense),
      remaining_budget: String(Math.max(totalBudget - expense, 0)),
      budget_utilization_percentage: toNumber(summary.budget_utilization),
    },
    income_ledger: (raw?.income_ledger ?? []).map((entry: any) => ({
      id: String(entry.id),
      source: entry.payer_name ?? 'Unknown',
      cluster: entry.source_type === 'CLUSTER' ? 'Cluster' : '',
      amount: String(entry.amount ?? '0'),
      date: toDateOnly(entry.date),
      type: 'ACTUAL',
      submission_status: entry.source_type === 'CLUSTER' ? 'SUBMITTED' : 'PENDING',
      description: entry.description ?? '',
    })),
    expense_ledger: (raw?.expense_ledger ?? []).map((entry: any) => ({
      id: String(entry.id),
      budget_item: entry.category || 'General',
      subcommittee: entry.vendor || '-',
      amount_approved: String(entry.amount ?? '0'),
      amount_paid: entry.status === 'PAID' ? String(entry.amount ?? '0') : '0',
      date_paid: toDateOnly(entry.date),
      status: entry.status === 'PAID' ? 'PAID' : 'PENDING',
      notes: entry.description ?? '',
    })),
    charts: {
      income_vs_expense: [
        { label: 'Income', value: income },
        { label: 'Expense', value: expense },
      ],
      budget_vs_actual: [
        { label: 'Budget', value: totalBudget },
        { label: 'Spent', value: expense },
      ],
      committee_budget_utilization: (raw?.channel_breakdown ?? []).map((item: any) => ({
        label: item.label,
        value: toNumber(item.value),
      })),
    },
  };
};

const normalizeClusterReport = (eventId: string, raw: any): ClusterReportData => {
  const clusterOverview = (raw?.clusters ?? []).map((cluster: any) => ({
    id: String(cluster.id),
    name: cluster.name,
    target_amount: String(cluster.target_amount ?? 0),
    collected_amount: String(cluster.collected_amount ?? 0),
    pledged_amount: String(cluster.pledged_amount ?? 0),
    submitted_to_treasurer: String(cluster.submitted_to_treasurer ?? 0),
    outstanding_amount: String(cluster.balance ?? 0),
    progress_percentage: toNumber(cluster.progress_percentage),
    lead_name: cluster.lead_name ?? cluster.cluster_lead ?? 'Unassigned',
  }));

  return {
    event_id: String(eventId),
    event_name: 'Event',
    report_date: new Date().toISOString(),
    cluster_overview: clusterOverview,
    collection_ledger: (raw?.collection_ledger ?? []).map((entry: any) => ({
      id: String(entry.id),
      donor_source: entry.contributor_name ?? 'Unknown',
      amount: String(entry.amount ?? '0'),
      mode: entry.payment_channel === 'BANK' ? 'BANK_TRANSFER' : entry.payment_channel === 'MPESA' ? 'MOBILE_MONEY' : 'CASH',
      date: toDateOnly(entry.date),
      is_pledge: false,
      submission_status: 'SUBMITTED',
      cluster: entry.cluster_name ?? '',
    })),
    charts: {
      cluster_contribution: clusterOverview.map((cluster: any) => ({
        label: cluster.name,
        value: toNumber(cluster.collected_amount),
      })),
      cluster_performance: clusterOverview.map((cluster: any) => ({
        label: cluster.name,
        value: toNumber(cluster.progress_percentage),
      })),
    },
  };
};

const normalizeMemberReport = (eventId: string, raw: any): MemberReportData => ({
  event_id: String(eventId),
  event_name: 'Event',
  report_date: new Date().toISOString(),
  member_activity: (raw?.members ?? []).map((member: any) => ({
    id: String(member.id),
    name: member.full_name,
    role: member.role,
    subcommittees_assigned: [],
    tasks_assigned: toNumber(member.tasks_assigned),
    tasks_completed: toNumber(member.tasks_completed),
    completion_rate_percentage: toNumber(member.completion_rate),
    cluster_role: 'NONE',
    last_activity_date: toDateOnly(member.joined_at),
  })),
  charts: {
    member_participation_activity: (raw?.members ?? []).slice(0, 12).map((member: any) => ({
      label: member.full_name,
      value: toNumber(member.tasks_completed),
    })),
    member_distribution_by_committees: (raw?.role_distribution ?? []).map((entry: any) => ({
      label: entry.label,
      value: toNumber(entry.value),
    })),
  },
});

export const reportService = {
  // =========================================================================
  // EXISTING COMMITTEE REPORT ENDPOINTS
  // =========================================================================
  getCommitteeReport: async (committeeId: number): Promise<CommitteeReport> => {
    const response = await apiClient.get('/reports/committee_report/', {
      params: { committee: committeeId },
    });
    const data = response.data;
    return {
      committee: {
        id: data.committee_id,
        name: data.committee_name,
        description: '',
        event_type: '',
        event_date: '',
        status: 'ACTIVE',
        created_by: undefined as any,
        created_at: '',
        updated_at: '',
      },
      total_members: data.member_count,
      total_tasks: data.task_count,
      completed_tasks: data.completed_tasks,
      pending_tasks: data.pending_tasks,
      total_collections: data.total_collections,
      total_expenses: data.total_expenses,
      balance: data.balance,
      providers_count: data.provider_count,
    };
  },

  getEventSummary: async (committeeId: number): Promise<any> => {
    const response = await apiClient.get('/reports/event_summary/', {
      params: { committee: committeeId },
    });
    return response.data;
  },

  getUserActivity: async (userId?: number): Promise<any> => {
    const response = await apiClient.get('/reports/user_activity/', {
      params: userId ? { user_id: userId } : undefined,
    });
    return response.data;
  },

  getAllCommittees: async (): Promise<any> => {
    const response = await apiClient.get('/reports/all_committees/');
    return response.data;
  },

  // =========================================================================
  // NEW EVENT-LEVEL REPORT ENDPOINTS
  // =========================================================================

  /**
   * Get Summary Report for an event
   * Includes KPIs, summary charts, and top insights
   */
  getEventSummaryReport: async (
    eventId: string,
    startDate?: string,
    endDate?: string
  ): Promise<SummaryReportData> => {
    const response = await apiClient.get(`/events/${eventId}/reports/summary/`, {
      params: withReportDates(startDate, endDate),
    });
    return normalizeSummaryReport(eventId, response.data);
  },

  /**
   * Get Operations Report for an event
   * Includes task breakdowns and subcommittee performance
   */
  getEventOperationsReport: async (
    eventId: string,
    startDate?: string,
    endDate?: string
  ): Promise<OperationsReportData> => {
    const response = await apiClient.get(`/events/${eventId}/reports/operations/`, {
      params: withReportDates(startDate, endDate),
    });
    return normalizeOperationsReport(eventId, response.data);
  },

  /**
   * Get Finance Report for an event
   * Includes budget overview and ledgers
   */
  getEventFinanceReport: async (
    eventId: string,
    startDate?: string,
    endDate?: string
  ): Promise<FinanceReportData> => {
    const response = await apiClient.get(`/events/${eventId}/reports/finance/`, {
      params: withReportDates(startDate, endDate),
    });
    return normalizeFinanceReport(eventId, response.data);
  },

  /**
   * Get Cluster Report for an event
   * Includes cluster mobilization progress
   */
  getEventClusterReport: async (
    eventId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ClusterReportData> => {
    const response = await apiClient.get(`/events/${eventId}/reports/clusters/`, {
      params: withReportDates(startDate, endDate),
    });
    return normalizeClusterReport(eventId, response.data);
  },

  /**
   * Get Member Participation Report for an event
   * Includes member activity and engagement metrics
   */
  getEventMemberReport: async (
    eventId: string,
    startDate?: string,
    endDate?: string
  ): Promise<MemberReportData> => {
    const response = await apiClient.get(`/events/${eventId}/reports/members/`, {
      params: withReportDates(startDate, endDate),
    });
    return normalizeMemberReport(eventId, response.data);
  },

  /**
   * Export report data in specified format
   */
  exportReport: async (
    eventId: string,
    reportType: 'summary' | 'operations' | 'finance' | 'clusters' | 'members',
    format: 'pdf' | 'xlsx' | 'csv' = 'pdf',
    startDate?: string,
    endDate?: string
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/events/${eventId}/reports/${reportType}/export/`,
      {
        params: {
          format,
          start_date: startDate,
          end_date: endDate,
        },
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
