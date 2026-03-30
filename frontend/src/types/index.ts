// User & Authentication Types
export interface User {
  id: number;
  username?: string;
  full_name: string;
  phone: string;
  email?: string;
  role: 'ADMIN' | 'LEADER' | 'MEMBER' | 'FINANCE' | 'STAKEHOLDER';
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
  id: string;
  event: string;  // Event UUID
  user: User;
  role: 'OWNER' | 'CHAIR' | 'TREASURER' | 'SECRETARY' | 'MEMBER';
  added_at: string;
}

// Enhanced Committee Types (Phase 5)
export interface CommitteePhase6 {
  id: string;  // UUID
  event: string;  // Event UUID
  event_name: string;  // Display field
  committee_type: 'MAIN' | 'BUDGET' | 'FUNDS_MOBILIZATION' | 'LOGISTICS' | 'CATERING' | 'OTHER';
  committee_type_display: string;
  is_main: boolean;
  lead: string;  // User ID
  lead_name: string;  // Display field
  description?: string;
  
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
  status: 'PENDING' | 'APPROVED_CHAIR' | 'APPROVED_TREASURER' | 'APPROVED_FINANCE' | 'REJECTED' | 'PAID';
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
  cluster_type: 'AGE_GROUP' | 'GENDER' | 'PROFESSION' | 'LOCATION' | 'OTHER';
  target_amount?: string;
  collected_amount?: string;
  leader?: string;  // User ID
  description?: string;
  created_at: string;
}

export interface BudgetItem {
  id: string;
  event: string;
  committee?: string;
  item_name: string;
  description?: string;
  allocated_amount: string;
  spent_amount: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  created_at: string;
}
