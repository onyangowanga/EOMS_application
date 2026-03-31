// User & Authentication Types
export type LegacyRole = 'ADMIN' | 'LEADER' | 'MEMBER' | 'FINANCE' | 'STAKEHOLDER';

export type RBACRole =
  | 'chair'
  | 'secretary'
  | 'treasurer'
  | 'finance_member'
  | 'budget_member'
  | 'mobilisation_member'
  | 'committee_member'
  | 'subcommittee_lead'
  | 'subcommittee_member'
  | 'cluster_lead'
  | 'cluster_member'
  | 'executive_admin';

export interface User {
  id: number;
  username?: string;
  full_name: string;
  phone: string;
  email?: string;
  role: LegacyRole;
  roles?: RBACRole[];
  subcommittee_roles?: Record<string, 'lead' | 'member'>;
  cluster_roles?: Record<string, 'lead' | 'member'>;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  identifier: string;  // Phone number or username
  delivery_method: 'sms' | 'email';  // How to deliver OTP
}

export interface LoginResponse {
  message: string;
  sent: boolean;
  method: string;
  otp?: string; // Only in dev mode when sending fails
}

export interface VerifyOTPRequest {
  identifier: string;  // Phone or email used for OTP
  otp_code: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  user: User;
}

// Committee Types
export interface Committee {
  id: number;
  name: string;
  description: string;
  event_type: string;
  event_date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  created_by: User;
  created_at: string;
  updated_at: string;
  members?: CommitteeMember[];
}

export interface CommitteeMember {
  id: number;
  user: User;
  role: 'TEAM_LEAD' | 'MEMBER';
  role_display: string;
  is_lead: boolean;
  role_description?: string;
  joined_at: string;
}

export interface AddMemberRequest {
  user_id: number;
  is_lead?: boolean;
  role_description?: string;
}

// Task Types
export interface Task {
  id: number;
  title: string;
  description: string;
  committee: Committee;
  assigned_to?: User;
  created_by: User;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimated_cost?: string;
  deadline?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: number;
  user: User;
  comment: string;
  created_at: string;
}

export interface TaskCreate {
  title: string;
  description: string;
  committee_id: number;
  assigned_to_id?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimated_cost?: number;
  deadline?: string;
}

// Finance Types
export interface Collection {
  id: number;
  committee: Committee;
  payer_name: string;
  payer_phone: string;
  amount: string;
  channel: 'CASH' | 'MPESA' | 'BANK' | 'OTHER';
  reference_number?: string;
  description?: string;
  recorded_by: User;
  created_at: string;
}

export interface CollectionCreate {
  committee_id: number;
  payer_name: string;
  payer_phone?: string;
  amount: number;
  channel: 'CASH' | 'MPESA' | 'BANK' | 'OTHER';
  reference_number?: string;
  description?: string;
}

export interface Expense {
  id: number;
  committee: Committee;
  vendor: string;
  amount: string;
  category: 'TRANSPORT' | 'FOOD' | 'VENUE' | 'EQUIPMENT' | 'SERVICE' | 'MATERIALS' | 'OTHER';
  description: string;
  receipt_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  requested_by: User;
  approved_by?: User;
  approved_at?: string;
  created_at: string;
}

export interface ExpenseCreate {
  committee_id: number;
  vendor: string;
  amount: number;
  category: 'TRANSPORT' | 'FOOD' | 'VENUE' | 'EQUIPMENT' | 'SERVICE' | 'MATERIALS' | 'OTHER';
  description?: string;
  receipt_url?: string;
}

export interface FinanceSummary {
  total_collections: string;
  total_expenses: string;
  balance: string;
}

// Service Provider Types
export interface ServiceProvider {
  id: number;
  committee: Committee;
  name: string;
  provider_type: 'MORTUARY' | 'TRANSPORT' | 'CATERING' | 'VENUE' | 'EQUIPMENT' | 'PRINTING' | 'MUSIC' | 'OTHER';
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
  cost_estimate?: string;
  actual_cost?: string;
  status: 'QUOTED' | 'BOOKED' | 'CONFIRMED' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  added_by: User;
  created_at: string;
}

export interface ServiceProviderCreate {
  committee_id: number;
  name: string;
  provider_type: 'MORTUARY' | 'TRANSPORT' | 'CATERING' | 'VENUE' | 'EQUIPMENT' | 'PRINTING' | 'MUSIC' | 'OTHER';
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  cost_estimate?: number;
  notes?: string;
}

// Report Types
export interface CommitteeReport {
  committee: Committee;
  total_members: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_collections: string;
  total_expenses: string;
  balance: string;
  providers_count: number;
}

// Event Types (Phase 5+)
export interface Event {
  id: string;  // UUID
  event_name: string;
  event_type: 'FUNERAL' | 'WEDDING' | 'CORPORATE' | 'OTHER';
  event_date: string;
  location: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  financial_progress?: string;  // Decimal percentage
  operational_progress?: string;  // Decimal percentage
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  event_name: string;
  event_type: 'FUNERAL' | 'WEDDING' | 'CORPORATE' | 'OTHER';
  event_date: string;
  location: string;
  description?: string;
}

export interface EventMember {
  id: number;
  event: number;  // Event ID
  user: number;   // User ID
  user_details: User;  // Full user object
  role: 'EVENT_OWNER' | 'CHAIRMAN' | 'TREASURER' | 'SECRETARY' | 'TEAM_LEAD' | 'CLUSTER_LEAD' | 'MEMBER';
  role_display: string;
  full_name: string;
  phone: string;
  alternative_phone?: string;
  email: string;
  is_active: boolean;
  is_official: boolean;
  is_executive: boolean;
  has_super_admin_rights: boolean;
  can_approve_expenses: boolean;
  can_manage_roles: boolean;
  can_create_tasks: boolean;
  joined_at: string;
  updated_at: string;
}

// Enhanced Committee Types (Phase 5)
export interface CommitteePhase6 {
  id: string;  // UUID
  event: string;  // Event UUID
  event_name: string;  // Display field
  name: string;  // Committee name
  committee_type:
    | 'MAIN'
    | 'BUDGET'
    | 'BUDGET_FINANCE'
    | 'FUNDS_MOBILIZATION'
    | 'LOGISTICS'
    | 'CATERING'
    | 'VENUE'
    | 'TRANSPORT'
    | 'MEDIA'
    | 'SECURITY'
    | 'OTHER';
  committee_type_display: string;
  is_main: boolean;
  lead: string;  // User ID
  lead_name: string;  // Display field
  description?: string;
  budget_allocation?: string;  // Allocated budget amount
  deadline?: string;  // Committee deadline
  expected_activities?: string;  // Expected activities
  
  // Calculated fields
  operational_progress?: string;  // Average task progress
  member_count?: number;
  task_count?: number;
  tasks_completed?: number;
  
  created_at: string;
  updated_at: string;
}

// Enhanced Task Types (Phase 5)
export interface TaskPhase6 {
  id: string;  // UUID
  event: string;  // Event UUID
  event_name: string;  // Display field
  committee?: string;  // Committee UUID
  title: string;
  description: string;
  assigned_to?: string;  // User ID
  assigned_to_name?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  status_display: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priority_display: string;
  progress_percentage: string;  // Decimal 0.00 - 100.00
  progress_status: string;  // Calculated: "Not Started", "In Progress", etc.
  deadline?: string;
  days_remaining?: number;  // Calculated
  is_overdue?: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Enhanced Finance Types (Phase 5)
export interface CollectionPhase6 {
  id: string;  // UUID
  event: string;  // Event UUID
  event_name: string;  // Display field
  cluster?: string;  // Cluster UUID
  cluster_name?: string;
  source_type: 'CLUSTER' | 'GENERAL';
  source_type_display: string;
  amount: string;  // Decimal
  description?: string;
  received_at: string;
  created_at: string;
}

export interface ExpensePhase6 {
  id: string;  // UUID
  event: string;  // Event UUID
  event_name: string;  // Display field
  budget_item?: string;  // Budget item UUID
  budget_item_name?: string;
  category: string;
  description: string;
  amount: string;  // Decimal
  status: 'PENDING' | 'APPROVED_CHAIR' | 'APPROVED_TREASURER' | 'APPROVED_FINANCE' | 'FULLY_APPROVED' | 'REJECTED' | 'PAID';
  status_display: string;
  
  // 3-tier approval
  approved_by_chair?: string;
  chair_name?: string;
  approved_by_treasurer?: string;
  treasurer_name?: string;
  approved_by_finance?: string;
  finance_name?: string;
  approval_progress?: string;  // "X/3 approvals"
  is_fully_approved?: boolean;
  
  rejection_reason?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// Event Progress Summary
export interface EventProgress {
  event_id: string;
  event_name: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  not_started_tasks: number;
  average_progress: string;
  completion_rate: string;
  on_track_tasks: number;
  overdue_tasks: number;
}

// Financial Summary (Phase 6)
export interface FinancialSummary {
  event_id: string;
  event_name: string;
  collections: {
    total: string;
    cluster: string;
    general: string;
  };
  expenses: {
    total: string;
    paid: string;
    pending: string;
    fully_approved: string;
    awaiting_approval: string;
  };
  balance: string;
  expenses_by_status: {
    [key: string]: number;
  };
  budget_utilization: string;
  financial_health: string;
}

// Cluster Types (Phase 2)
export interface ClusterGroup {
  id: string;  // UUID
  event: string;  // Event UUID
  name: string;
  cluster_type?: 'AGE_GROUP' | 'GENDER' | 'PROFESSION' | 'LOCATION' | 'OTHER';
  target_amount?: string;
  collected_amount?: string;
  pledged_amount?: string;
  balance?: string;
  progress_percentage?: string;
  funds_in_lead_account?: string;
  submitted_to_treasurer?: string;
  pending_in_lead_account?: string;
  cluster_lead?: string;
  cluster_lead_name?: string;
  leader?: string;  // Legacy alias
  description?: string;
  contributions?: ClusterContribution[];
  deposits?: ClusterDeposit[];
  created_at: string;
  updated_at?: string;
}

export interface ClusterContribution {
  id: string;
  cluster: string;
  contributor_name: string;
  contributor_phone?: string;
  amount: string;
  is_pledge: boolean;
  pledge_fulfilled: boolean;
  pledge_fulfillment_date?: string;
  payment_channel?: 'CASH' | 'MPESA' | 'BANK' | 'CHEQUE' | 'OTHER';
  payment_channel_display?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClusterDeposit {
  id: string;
  cluster: string;
  cluster_name?: string;
  amount: string;
  deposit_channel?: 'CASH' | 'MPESA' | 'BANK' | 'CHEQUE' | 'OTHER';
  deposit_channel_display?: string;
  reference_number?: string;
  confirmed_by_treasurer: boolean;
  treasurer_confirmation_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface BudgetItem {
  id: string;
  event: string;
  committee?: string;
  committee_name?: string;
  item_name: string;
  title?: string; // Alias for item_name
  description?: string;
  allocated_amount: string;
  estimated_cost?: string; // Alias for allocated_amount
  spent_amount: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  linked_task?: number | null;
  linked_task_title?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
  // Approval progress fields
  chairman_approved?: boolean;
  treasurer_approved?: boolean;
  finance_approved?: boolean;
}

// ============================================================================
// EVENT REPORTS TYPES (Phase 6+)
// ============================================================================

// KPI Card Data
export interface KPIData {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: number; // percentage change
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

// Chart Data
export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
}

// Subcommittee Performance
export interface SubcommitteePerformance {
  id: string;
  name: string;
  total_tasks: number;
  completed_tasks: number;
  blocked_tasks: number;
  overdue_tasks: number;
  progress_percentage: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
  tasks_completed_rate: string;
  average_task_progress: string;
}

// Task Summary
export interface TaskSummaryItem {
  id: string;
  title: string;
  subcommittee_name: string;
  assigned_to?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'BLOCKED';
  progress_percentage: number;
  deadline?: string;
  days_remaining?: number;
  is_overdue: boolean;
  budget_item?: string;
  cost_estimate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

// Budget Overview
export interface BudgetOverviewReport {
  total_estimated_budget: string;
  approved_budget: string;
  pending_budget_items_count: number;
  pending_budget_items_amount: string;
  used_budget_paid: string;
  remaining_budget: string;
  budget_utilization_percentage: number;
}

// Income Ledger
export interface IncomeLedgerEntry {
  id: string;
  source: string;
  cluster?: string;
  amount: string;
  date: string;
  type: 'PLEDGE' | 'ACTUAL';
  submission_status: 'SUBMITTED' | 'PENDING';
  description?: string;
}

// Expense Ledger
export interface ExpenseLedgerEntry {
  id: string;
  budget_item: string;
  subcommittee: string;
  amount_approved: string;
  amount_paid: string;
  date_paid: string;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  notes?: string;
  receipt_url?: string;
}

// Cluster Overview
export interface ClusterReportEntry {
  id: string;
  name: string;
  target_amount: string;
  collected_amount: string;
  pledged_amount: string;
  submitted_to_treasurer: string;
  outstanding_amount: string;
  progress_percentage: number;
  lead_name: string;
}

// Collection Entry
export interface CollectionLedgerEntry {
  id: string;
  donor_source: string;
  amount: string;
  mode: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_MONEY';
  date: string;
  is_pledge: boolean;
  submission_status: 'SUBMITTED' | 'PENDING' | 'OUTSTANDING';
  cluster?: string;
}

// Member Activity
export interface MemberActivityEntry {
  id: string;
  name: string;
  role: 'CHAIR' | 'TREASURER' | 'VICE_CHAIR' | 'MEMBER';
  subcommittees_assigned: string[];
  tasks_assigned: number;
  tasks_completed: number;
  completion_rate_percentage: number;
  cluster_role?: 'LEAD' | 'MEMBER' | 'NONE';
  last_activity_date?: string;
}

// Summary Report Data
export interface SummaryReportData {
  event_id: string;
  event_name: string;
  report_date: string;
  kpis: {
    operational_progress: KPIData;
    financial_progress: KPIData;
    total_funds_collected: KPIData;
    total_funds_spent: KPIData;
    total_budget_estimate: KPIData;
    remaining_budget: KPIData;
    tasks_completed: KPIData;
    mobilization_progress: KPIData;
  };
  charts: {
    daily_collections: ChartDataPoint[];
    subcommittee_progress: ChartDataPoint[];
    expense_distribution: ChartDataPoint[];
  };
  tables: {
    overdue_tasks: TaskSummaryItem[];
    largest_expenses: ExpenseLedgerEntry[];
    latest_contributions: IncomeLedgerEntry[];
    pending_approvals: BudgetItem[];
  };
}

// Operations Report Data
export interface OperationsReportData {
  event_id: string;
  event_name: string;
  report_date: string;
  subcommittee_performance: SubcommitteePerformance[];
  task_breakdown: TaskSummaryItem[];
  charts: {
    tasks_by_status: ChartDataPoint[];
    subcommittee_progress: ChartDataPoint[];
    tasks_over_time: ChartDataPoint[];
  };
}

// Finance Report Data
export interface FinanceReportData {
  event_id: string;
  event_name: string;
  report_date: string;
  budget_overview: BudgetOverviewReport;
  income_ledger: IncomeLedgerEntry[];
  expense_ledger: ExpenseLedgerEntry[];
  charts: {
    income_vs_expense: ChartDataPoint[];
    budget_vs_actual: ChartDataPoint[];
    committee_budget_utilization: ChartDataPoint[];
  };
}

// Cluster Mobilization Report Data
export interface ClusterReportData {
  event_id: string;
  event_name: string;
  report_date: string;
  cluster_overview: ClusterReportEntry[];
  collection_ledger: CollectionLedgerEntry[];
  charts: {
    cluster_contribution: ChartDataPoint[];
    cluster_performance: ChartDataPoint[];
  };
}

// Member Participation Report Data
export interface MemberReportData {
  event_id: string;
  event_name: string;
  report_date: string;
  member_activity: MemberActivityEntry[];
  charts: {
    member_participation_activity: ChartDataPoint[];
    member_distribution_by_committees: ChartDataPoint[];
  };
}
