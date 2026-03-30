import apiClient from './api';
import type {
  Event,
  EventCreate,
  EventMember,
  EventProgress,
  FinancialSummary,
  CommitteePhase6,
  TaskPhase6,
  CollectionPhase6,
  ExpensePhase6,
  ClusterGroup,
  BudgetItem
} from '../types';

/**
 * Event Service - Handles all event-related API calls
 * Integrates with Phase 5 & 6 backend models and endpoints
 */

class EventService {
  private readonly baseUrl = '/events';

  // ==================== Event CRUD ====================

  /**
   * Get all events
   */
  async getAllEvents(): Promise<Event[]> {
    const response = await apiClient.get<Event[] | { results: Event[] }>(this.baseUrl + '/');
    // Handle pagination wrapper from DRF
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results;
    }
    return response.data as Event[];
  }

  /**
   * Get a single event by ID
   */
  async getEvent(id: string): Promise<Event> {
    const response = await apiClient.get<Event>(`${this.baseUrl}/${id}/`);
    return response.data;
  }

  /**
   * Create a new event
   */
  async createEvent(data: EventCreate): Promise<Event> {
    const response = await apiClient.post<Event>(this.baseUrl + '/', data);
    return response.data;
  }

  /**
   * Create event with optional executive committee bootstrap payload
   */
  async createEventWithCommittee(data: EventCreate & { committee_members?: unknown }): Promise<Event> {
    const response = await apiClient.post<Event>(this.baseUrl + '/', data);
    return response.data;
  }

  /**
   * Update an event
   */
  async updateEvent(id: string, data: Partial<EventCreate>): Promise<Event> {
    const response = await apiClient.patch<Event>(`${this.baseUrl}/${id}/`, data);
    return response.data;
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}/`);
  }

  // ==================== Event Members ====================

  /**
   * Get all members of an event
   */
  async getEventMembers(eventId: string): Promise<EventMember[]> {
    const response = await apiClient.get<EventMember[]>(`${this.baseUrl}/${eventId}/members/`);
    return response.data;
  }

  /**
   * Add a member to an event
   */
  async addEventMember(
    eventId: string,
    userId: number,
    role: 'EVENT_OWNER' | 'CHAIRMAN' | 'TREASURER' | 'SECRETARY' | 'MEMBER'
  ): Promise<EventMember> {
    const response = await apiClient.post<EventMember>(
      `${this.baseUrl}/${eventId}/add_member/`,
      { user_id: userId, role }
    );
    return response.data;
  }

  /**
   * Remove a member from an event
   */
  async removeEventMember(eventId: string, userId: number): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${eventId}/remove_member/`, { user_id: userId });
  }

  // ==================== Event Committees (Phase 6) ====================

  /**
   * Get all committees for an event
   */
  async getEventCommittees(eventId: string): Promise<CommitteePhase6[]> {
    const response = await apiClient.get<CommitteePhase6[]>(
      `/committees/by_event/?event_id=${eventId}`
    );
    return response.data;
  }

  /**
   * Get the main committee for an event
   */
  async getMainCommittee(eventId: string): Promise<CommitteePhase6> {
    const response = await apiClient.get<CommitteePhase6>(
      `/committees/main_committee/?event_id=${eventId}`
    );
    return response.data;
  }

  /**
   * Create a subcommittee for an event
   */
  async createSubcommittee(data: {
    event: string;
    name: string;
    description?: string;
    committee_type?: string;
    is_main?: boolean;
  }): Promise<CommitteePhase6> {
    const response = await apiClient.post<CommitteePhase6>('/committees/', {
      event: data.event,
      name: data.name,
      description: data.description || '',
      committee_type: data.committee_type || 'OTHER',
      is_main: data.is_main || false,
    });
    return response.data;
  }

  /**
   * Get committee progress
   */
  async getCommitteeProgress(committeeId: string) {
    const response = await apiClient.get(`/committees/${committeeId}/progress/`);
    return response.data;
  }

  /**
   * Get committee budget status
   */
  async getCommitteeBudgetStatus(committeeId: string) {
    const response = await apiClient.get(`/committees/${committeeId}/budget_status/`);
    return response.data;
  }

  // ==================== Event Tasks (Phase 6) ====================

  /**
   * Get all tasks for an event
   */
  async getEventTasks(eventId: string): Promise<TaskPhase6[]> {
    const response = await apiClient.get<TaskPhase6[]>(
      `/tasks/by_event/?event_id=${eventId}`
    );
    return response.data;
  }

  /**
   * Get event-wide progress summary
   */
  async getEventProgress(eventId: string): Promise<EventProgress> {
    const response = await apiClient.get<EventProgress>(
      `/tasks/event_progress/?event_id=${eventId}`
    );
    return response.data;
  }

  /**
   * Get overdue tasks for an event
   */
  async getOverdueTasks(eventId?: string): Promise<TaskPhase6[]> {
    const url = `/tasks/overdue_tasks/` + (eventId ? `?event=${eventId}` : '');
    const response = await apiClient.get<TaskPhase6[]>(url);
    return response.data;
  }

  /**
   * Get not started tasks for an event
   */
  async getNotStartedTasks(eventId?: string): Promise<TaskPhase6[]> {
    const url = `/tasks/not_started/` + (eventId ? `?event=${eventId}` : '');
    const response = await apiClient.get<TaskPhase6[]>(url);
    return response.data;
  }

  /**
   * Update task progress
   */
  async updateTaskProgress(taskId: string, progressPercentage: number) {
    const response = await apiClient.patch(
      `/tasks/${taskId}/update_progress/`,
      { progress_percentage: progressPercentage.toFixed(2) }
    );
    return response.data;
  }

  // ==================== Event Finance (Phase 6) ====================

  /**
   * Get financial summary for an event
   */
  async getFinancialSummary(eventId: string): Promise<FinancialSummary> {
    const response = await apiClient.get<FinancialSummary>(
      `/finance/summary/?event_id=${eventId}`
    );
    return response.data;
  }

  /**
   * Get budget vs actual analysis
   */
  async getBudgetVsActual(eventId: string) {
    const response = await apiClient.get(`/finance/budget_vs_actual/?event_id=${eventId}`);
    return response.data;
  }

  /**
   * Get all collections for an event
   */
  async getEventCollections(eventId: string): Promise<CollectionPhase6[]> {
    const response = await apiClient.get<CollectionPhase6[]>(
      `/finance/collections/by_event/?event_id=${eventId}`
    );
    return response.data;
  }

  /**
   * Get cluster summary for collections
   */
  async getClusterSummary(eventId: string) {
    const response = await apiClient.get(
      `/finance/collections/cluster_summary/?event_id=${eventId}`
    );
    return response.data;
  }

  /**
   * Get all expenses for an event
   */
  async getEventExpenses(eventId: string): Promise<ExpensePhase6[]> {
    const response = await apiClient.get<ExpensePhase6[]>(
      `/finance/expenses/?event=${eventId}`
    );
    return response.data;
  }

  /**
   * Get expenses by budget item
   */
  async getExpensesByBudgetItem(budgetItemId: string) {
    const response = await apiClient.get(
      `/finance/expenses/by_budget_item/?budget_item_id=${budgetItemId}`
    );
    return response.data;
  }

  /**
   * Approve expense as chair
   */
  async approveAsChair(expenseId: string, comments?: string) {
    const response = await apiClient.post(`/finance/expenses/${expenseId}/approve_as_chair/`, {
      comments,
    });
    return response.data;
  }

  /**
   * Approve expense as treasurer
   */
  async approveAsTreasurer(expenseId: string, comments?: string) {
    const response = await apiClient.post(`/finance/expenses/${expenseId}/approve_as_treasurer/`, {
      comments,
    });
    return response.data;
  }

  /**
   * Approve expense as finance member
   */
  async approveAsFinance(expenseId: string, comments?: string) {
    const response = await apiClient.post(`/finance/expenses/${expenseId}/approve_as_finance/`, {
      comments,
    });
    return response.data;
  }

  /**
   * Mark expense as paid
   */
  async markExpensePaid(
    expenseId: string,
    paymentMethod: string,
    paymentReference: string,
    paymentNotes?: string
  ) {
    const response = await apiClient.post(`/finance/expenses/${expenseId}/mark_paid/`, {
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      payment_notes: paymentNotes,
    });
    return response.data;
  }

  // ==================== Event Clusters (Phase 2) ====================

  /**
   * Get all clusters for an event
   */
  async getEventClusters(eventId: string): Promise<ClusterGroup[]> {
    const response = await apiClient.get<ClusterGroup[]>(`${this.baseUrl}/clusters/?event=${eventId}`);
    return response.data;
  }

  /**
   * Create a cluster for an event
   */
  async createCluster(data: {
    event: string;
    name: string;
    cluster_type: 'AGE_GROUP' | 'GENDER' | 'PROFESSION' | 'LOCATION' | 'OTHER';
    target_amount?: number;
    leader?: number;
    description?: string;
  }): Promise<ClusterGroup> {
    const response = await apiClient.post<ClusterGroup>(`${this.baseUrl}/clusters/`, data);
    return response.data;
  }

  // ==================== Event Budget (Phase 3) ====================

  /**
   * Get all budget items for an event
   */
  async getEventBudgetItems(eventId: string): Promise<BudgetItem[]> {
    const response = await apiClient.get<BudgetItem[]>(`${this.baseUrl}/budget-items/?event=${eventId}`);
    return response.data;
  }

  /**
   * Create a budget item
   */
  async createBudgetItem(data: {
    event: string;
    committee?: string;
    item_name: string;
    description?: string;
    allocated_amount: number;
  }): Promise<BudgetItem> {
    const response = await apiClient.post<BudgetItem>('/budget-items/', data);
    return response.data;
  }

  // ==================== Dashboard Aggregated Data ====================

  /**
   * Get complete dashboard data for an event
   * Aggregates data from multiple endpoints for performance
   */
  async getEventDashboard(eventId: string) {
    try {
      const [
        event,
        financialSummary,
        eventProgress,
        committees,
        recentTasks,
        overdueTasks,
        clusters,
      ] = await Promise.all([
        this.getEvent(eventId),
        this.getFinancialSummary(eventId).catch(() => null),
        this.getEventProgress(eventId).catch(() => null),
        this.getEventCommittees(eventId).catch(() => []),
        this.getEventTasks(eventId).then(tasks => tasks.slice(0, 5)).catch(() => []),
        this.getOverdueTasks(eventId).catch(() => []),
        this.getEventClusters(eventId).catch(() => []),
      ]);

      return {
        event,
        financialSummary,
        eventProgress,
        committees,
        recentTasks,
        overdueTasks,
        clusters,
      };
    } catch (error) {
      console.error('Error fetching event dashboard:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
