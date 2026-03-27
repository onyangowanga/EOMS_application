// User & Authentication Types
export interface User {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  role: 'ADMIN' | 'LEADER' | 'MEMBER' | 'FINANCE' | 'STAKEHOLDER';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  phone: string;
}

export interface LoginResponse {
  message: string;
  otp_code?: string; // Only in dev mode
}

export interface VerifyOTPRequest {
  phone: string;
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
