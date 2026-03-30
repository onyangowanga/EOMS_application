import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Assignment,
  AttachMoney,
  Warning,
  CheckCircle,
  Event as EventIcon,
  LocationOn,
  Refresh,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/event.service';
import type {Event, CommitteePhase6, TaskPhase6 } from '../types';

/**
 * Event Dashboard Component - Phase 7
 * 
 * Displays comprehensive overview of event including:
 * - Event header with status and dates
 * - Financial summary (collections, expenses, balance)
 * - Operational progress (tasks, committees)
 * - Recent activity
 * - Alerts for overdue tasks
 */
const EventDashboard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Validate eventId - prevent reserved words like "create" from being used as event IDs
  React.useEffect(() => {
    if (eventId && ['create', 'new', 'add'].includes(eventId.toLowerCase())) {
      console.error('Invalid event ID detected:', eventId);
      navigate('/events/create', { replace: true });
    } else if (eventId) {
      // Store last viewed event ID for smart redirection on next login
      localStorage.setItem('lastViewedEventId', eventId);
      console.log('📌 Saved last viewed event:', eventId);
    }
  }, [eventId, navigate]);

  // No need to fetch all events - this is a single event system
  // Removing event switcher functionality

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['event-dashboard', eventId],
    queryFn: () => eventService.getEventDashboard(eventId!),
    enabled: !!eventId,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <Alert severity="error">
        Failed to load event dashboard. Please try again.
      </Alert>
    );
  }

  const { event, financialSummary, eventProgress, committees, recentTasks, overdueTasks, clusters } =
    dashboardData;

  return (
    <Box>
      {/* Event Header - Simplified for single event system */}
      <EventHeader 
        event={event}
        onRefresh={refetch}
      />

      {/* Overdue Tasks Alert */}
      {overdueTasks && overdueTasks.length > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            {overdueTasks.length} task{overdueTasks.length > 1 ? 's are' : ' is'} overdue!
          </Typography>
          <Typography variant="body2">
            Please review and update overdue tasks to keep the event on track.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Financial Summary */}
        {financialSummary && financialSummary.collections && financialSummary.expenses && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total Collections"
                value={`KSH ${parseFloat(financialSummary.collections.total || '0').toLocaleString()}`}
                icon={<AttachMoney />}
                color="#2e7d32"
                subtitle={`Cluster: KSH ${parseFloat(financialSummary.collections.cluster || '0').toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total Expenses"
                value={`KSH ${parseFloat(financialSummary.expenses.total || '0').toLocaleString()}`}
                icon={<TrendingUp />}
                color="#d32f2f"
                subtitle={`Paid: KSH ${parseFloat(financialSummary.expenses.paid || '0').toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Current Balance"
                value={`KSH ${parseFloat(financialSummary.balance || '0').toLocaleString()}`}
                icon={<AttachMoney />}
                color={parseFloat(financialSummary.balance || '0') >= 0 ? '#2e7d32' : '#d32f2f'}
                subtitle={`Utilization: ${financialSummary.budget_utilization || '0'}%`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Pending Approvals"
                value={financialSummary.expenses.awaiting_approval}
                icon={<Warning />}
                color="#ed6c02"
                subtitle={`Fully Approved: ${financialSummary.expenses.fully_approved}`}
              />
            </Grid>
          </>
        )}

        {/* Operational Stats */}
        {eventProgress && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total Tasks"
                value={eventProgress.total_tasks}
                icon={<Assignment />}
                color="#1976d2"
                subtitle={`Completed: ${eventProgress.completed_tasks}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Completion Rate"
                value={`${parseFloat(eventProgress.completion_rate).toFixed(0)}%`}
                icon={<CheckCircle />}
                color="#9c27b0"
                subtitle={`Avg Progress: ${parseFloat(eventProgress.average_progress).toFixed(0)}%`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Committees"
                value={committees.length}
                icon={<People />}
                color="#0288d1"
                subtitle={`With ${eventProgress.total_tasks} tasks`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Clusters"
                value={clusters.length}
                icon={<People />}
                color="#7b1fa2"
                subtitle="Fund mobilization groups"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s',
                  },
                }}
                onClick={() => navigate(`/events/${eventId}/committee-members`)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" variant="body2" gutterBottom>
                        Committee Members
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {committees.reduce((acc, comm) => acc + (comm.member_count || 0), 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click to manage
                      </Typography>
                    </Box>
                    <Box sx={{ color: '#00695c', opacity: 0.8 }}>
                      <People />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Progress Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Financial Progress */}
        {event.financial_progress && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Financial Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(event.financial_progress)}
                  sx={{ height: 10, borderRadius: 5 }}
                  color={parseFloat(event.financial_progress) >= 75 ? 'success' : 'primary'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {parseFloat(event.financial_progress).toFixed(1)}% of financial targets met
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Operational Progress */}
        {event.operational_progress && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Operational Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(event.operational_progress)}
                  sx={{ height: 10, borderRadius: 5 }}
                  color={parseFloat(event.operational_progress) >= 75 ? 'success' : 'primary'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {parseFloat(event.operational_progress).toFixed(1)}% of tasks completed
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Committees & Recent Tasks */}
      <Grid container spacing={3}>
        {/* Committees Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Committees Overview
            </Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: { xs: 400, sm: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Committee</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Lead</TableCell>
                    <TableCell align="right">Tasks</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {committees.slice(0, 5).map((committee: CommitteePhase6) => (
                    <TableRow
                      key={committee.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/committees/${committee.id}`)}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {committee.committee_type_display}
                          </Typography>
                          {/* Mobile: Show lead below committee name */}
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ display: { xs: 'block', sm: 'none' } }}
                          >
                            {committee.lead_name}
                          </Typography>
                        </Box>
                        {committee.is_main && (
                          <Chip label="Main" size="small" color="primary" sx={{ ml: 1, fontSize: '0.65rem' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2" color="text.secondary">
                          {committee.lead_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {committee.tasks_completed}/{committee.task_count}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2">
                          {committee.operational_progress
                            ? `${parseFloat(committee.operational_progress).toFixed(0)}%`
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {committees.length > 5 && (
              <Typography
                variant="body2"
                color="primary"
                sx={{ mt: 2, cursor: 'pointer' }}
                onClick={() => navigate('/committees')}
              >
                View all {committees.length} committees →
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Recent Tasks
            </Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: { xs: 350, sm: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
                    <TableCell align="right">Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTasks.map((task: TaskPhase6) => (
                    <TableRow
                      key={task.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {task.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.assigned_to_name || 'Unassigned'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip
                          label={task.status_display}
                          size="small"
                          color={getTaskStatusColor(task.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">
                            {parseFloat(task.progress_percentage).toFixed(0)}%
                          </Typography>
                          {/* Mobile: Show status chip below progress */}
                          <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                            <Chip
                              label={task.status_display}
                              size="small"
                              color={getTaskStatusColor(task.status)}
                              sx={{ fontSize: '0.65rem' }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {eventProgress && eventProgress.total_tasks > 5 && (
              <Typography
                variant="body2"
                color="primary"
                sx={{ mt: 2, cursor: 'pointer' }}
                onClick={() => navigate('/tasks')}
              >
                View all {eventProgress.total_tasks} tasks →
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// ==================== Helper Components ====================

/**
 * Event Header Component - Single Event System
 * Shows THE event details (no switcher needed)
 */
const EventHeader: React.FC<{ 
  event: Event;
  onRefresh: () => void;
}> = ({ event, onRefresh }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box sx={{ flex: 1, minWidth: '250px' }}>
          <Typography variant="h4" gutterBottom>
            {event.event_name}
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              icon={<EventIcon />}
              label={event.event_type}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={getStatusDisplay(event.status)}
              color={getStatusColor(event.status) as any}
              variant="filled"
            />
            <Chip
              icon={<EventIcon />}
              label={new Date(event.event_date).toLocaleDateString()}
              variant="outlined"
            />
            <Chip icon={<LocationOn />} label={event.location} variant="outlined" />
          </Box>
          {event.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 800 }}>
              {event.description}
            </Typography>
          )}
        </Box>
        
        {/* Actions */}
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh dashboard">
            <IconButton onClick={onRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Stats Card Component
 */
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.8 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Dashboard Skeleton Loader
 */
const DashboardSkeleton: React.FC = () => {
  return (
    <Box>
      <Skeleton variant="rectangular" height={120} sx={{ mb: 3, borderRadius: 1 }} />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
        </Grid>
      </Grid>
    </Box>
  );
};

// ==================== Helper Functions ====================

function getStatusDisplay(status: string): string {
  const statusMap: { [key: string]: string } = {
    PLANNING: 'Planning',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return statusMap[status] || status;
}

function getStatusColor(status: string): 'default' | 'primary' | 'success' | 'error' {
  const colorMap: { [key: string]: 'default' | 'primary' | 'success' | 'error' } = {
    PLANNING: 'default',
    ACTIVE: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };
  return colorMap[status] || 'default';
}

function getTaskStatusColor(status: string): 'default' | 'primary' | 'warning' | 'success' {
  const colorMap: { [key: string]: 'default' | 'primary' | 'warning' | 'success' } = {
    TODO: 'default',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'warning',
  };
  return colorMap[status] || 'default';
}

export default EventDashboard;
