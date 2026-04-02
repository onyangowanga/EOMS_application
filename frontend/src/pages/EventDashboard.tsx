import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Stack,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  TrendingUp,
  People,
  AttachMoney,
  Warning,
  CheckCircle,
  Event as EventIcon,
  LocationOn,
  Refresh,
  ExpandMore,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/event.service';
import type {Event, CommitteePhase6, TaskPhase6 } from '../types';
import { isTaskBasedCommittee } from '../utils/committeeModules';
import { useAuth } from '../contexts/AuthContext';

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
  const { hasRole } = useAuth();

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

  const { data: pendingBudgetApprovals = [] } = useQuery({
    queryKey: ['budget-items', eventId, 'PENDING'],
    queryFn: () => eventService.getEventBudgetItems(eventId!, 'PENDING'),
    enabled: !!eventId,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', eventId, 'dashboard'],
    queryFn: () => eventService.getEventExpenses(eventId!),
    enabled: !!eventId,
  });

  const { data: clusterDeposits = [] } = useQuery({
    queryKey: ['cluster-deposits', eventId, 'dashboard'],
    queryFn: () => eventService.getClusterDeposits(eventId!),
    enabled: !!eventId,
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

  const operationalCommittees = (committees || []).filter((committee: CommitteePhase6) => isTaskBasedCommittee(committee));
  const normalizedExpenses: any[] = Array.isArray(expenses) ? expenses : ((expenses as any)?.results || []);
  const normalizedDeposits: any[] = Array.isArray(clusterDeposits) ? clusterDeposits : ((clusterDeposits as any)?.results || []);
  const clusterDepositsTotal = normalizedDeposits.reduce(
    (sum: number, d: any) => sum + parseFloat(d.amount || '0'), 0
  );
  const trueCollectionsTotal = parseFloat(financialSummary?.collections?.total || '0') + clusterDepositsTotal;
  const totalBudget = parseFloat((event as any).total_budget || '0');
  const collectionsAgainstBudgetProgress = totalBudget > 0
    ? (trueCollectionsTotal / totalBudget) * 100
    : 0;
  const pendingRequisitions = normalizedExpenses.filter((expense: any) =>
    ['PENDING', 'APPROVED_CHAIR', 'APPROVED_TREASURER'].includes(expense.status)
  );
  const pendingPayments = normalizedExpenses.filter((expense: any) => expense.status === 'FULLY_APPROVED');
  const pendingClusterSubmissions = normalizedDeposits.filter((deposit: any) => !deposit.confirmed_by_treasurer);
  const atRiskCommittees = operationalCommittees.filter((committee: CommitteePhase6) =>
    parseFloat((committee.operational_progress as string) || '0') < 50
  );

  const isAdmin = hasRole('executive_admin');
  const isFinance = hasRole(['finance_member', 'treasurer']);
  const isExecutive = hasRole(['chair', 'treasurer', 'secretary', 'executive_admin']);

  return (
    <Box>
      {/* Event Header - Simplified for single event system */}
      <EventHeader 
        event={event}
        operationalProgress={
          parseFloat(
            String(
              (eventProgress as any)?.overall_progress ??
              (eventProgress as any)?.completion_rate ??
              event.operational_progress ??
              0
            )
          ) || 0
        }
        financialProgress={
          collectionsAgainstBudgetProgress
        }
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
                value={`KSH ${trueCollectionsTotal.toLocaleString()}`}
                icon={<AttachMoney />}
                color="#2e7d32"
                subtitle={`General: KSH ${parseFloat(financialSummary.collections.general || '0').toLocaleString()} | Cluster: KSH ${clusterDepositsTotal.toLocaleString()}`}
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
                title="Total Budget"
                value={`KSH ${totalBudget.toLocaleString()}`}
                icon={<AttachMoney />}
                color="#1565c0"
                subtitle={`Spent: KSH ${parseFloat(financialSummary.expenses.total || '0').toLocaleString()}`}
              />
            </Grid>
          </>
        )}

        {/* Keep only Committee Members card in second row */}
        {eventProgress && (
          <>
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

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Quick Actions</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button size="small" variant="contained" onClick={() => navigate(`/events/${eventId}/dashboard`)}>
              Dashboard
            </Button>
            <Button size="small" variant="outlined" onClick={() => navigate(`/events/${eventId}/subcommittees`)}>
              Subcommittees
            </Button>
            <Button size="small" variant="outlined" onClick={() => navigate(`/events/${eventId}/clusters`)}>
              Clusters
            </Button>
            <Button size="small" variant="outlined" onClick={() => navigate(`/events/${eventId}/approvals`)}>
              Approvals Center
            </Button>
            {(isFinance || isExecutive || isAdmin) && (
              <Button size="small" variant="outlined" onClick={() => navigate(`/events/${eventId}/budget`)}>
                Finance Module
              </Button>
            )}
            {(isExecutive || isAdmin) && (
              <Button size="small" variant="outlined" onClick={() => navigate(`/events/${eventId}/subcommittees/create`)}>
                Create Subcommittee
              </Button>
            )}
            {(isExecutive || isAdmin) && (
              <Button size="small" variant="outlined" onClick={() => navigate(`/events/${eventId}/committee-members`)}>
                Add Committee Member
              </Button>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Subcommittee Overview</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box />
            <Button size="small" onClick={() => navigate(`/events/${eventId}/subcommittees`)}>
              View All
            </Button>
          </Stack>
          <Grid container spacing={2}>
            {operationalCommittees.slice(0, 6).map((committee: CommitteePhase6) => {
              const progress = parseFloat((committee.operational_progress as string) || '0');
              const statusLabel = progress >= 75 ? 'On track' : progress >= 50 ? 'Watch' : 'At risk';
              const statusColor = progress >= 75 ? 'success' : progress >= 50 ? 'warning' : 'error';

              return (
                <Grid item xs={12} sm={6} md={4} key={committee.id}>
                  <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => navigate(`/events/${eventId}/subcommittees/${committee.id}`)}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" fontWeight="bold">{committee.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Lead: {committee.lead_name || 'Unassigned'}
                        </Typography>
                        <LinearProgress variant="determinate" value={Math.min(progress, 100)} sx={{ height: 8, borderRadius: 4 }} />
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip size="small" label={`${progress.toFixed(0)}%`} />
                          <Chip size="small" label={`${committee.task_count || 0} tasks`} variant="outlined" />
                          <Chip size="small" label={statusLabel} color={statusColor as any} />
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {financialSummary && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Finance Summary Preview</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
              <Button size="small" variant="outlined" onClick={() => navigate(`/events/${eventId}/budget`)}>
                Open Finance Module
              </Button>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={6} md={2.4}>
                <StatsCard title="Estimated Budget" value={`KSH ${trueCollectionsTotal.toLocaleString()}`} icon={<AttachMoney />} color="#1976d2" />
              </Grid>
              <Grid item xs={6} md={2.4}>
                <StatsCard title="Approved Budget" value={`KSH ${parseFloat(financialSummary.expenses.fully_approved || '0').toLocaleString()}`} icon={<CheckCircle />} color="#2e7d32" />
              </Grid>
              <Grid item xs={6} md={2.4}>
                <StatsCard title="Pending Budget" value={pendingBudgetApprovals.length} icon={<Warning />} color="#ed6c02" />
              </Grid>
              <Grid item xs={6} md={2.4}>
                <StatsCard title="Used Budget" value={`KSH ${parseFloat(financialSummary.expenses.paid || '0').toLocaleString()}`} icon={<TrendingUp />} color="#d32f2f" />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <StatsCard title="Remaining" value={`KSH ${parseFloat(financialSummary.balance || '0').toLocaleString()}`} icon={<AttachMoney />} color="#0288d1" />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Cluster Mobilisation Summary</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 2 }}>
            <Button size="small" onClick={() => navigate(`/events/${eventId}/clusters`)}>
              Open Mobilisation Module
            </Button>
          </Stack>
          <Grid container spacing={2}>
            {(clusters || []).slice(0, 4).map((cluster: any) => (
              <Grid item xs={12} sm={6} md={3} key={cluster.id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold">{cluster.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target: KSH {parseFloat(cluster.target_amount || '0').toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Collected: KSH {parseFloat(cluster.collected_amount || '0').toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Pledged: KSH {parseFloat(cluster.pledged_amount || '0').toLocaleString()}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(parseFloat(cluster.progress_percentage || '0'), 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {parseFloat(cluster.progress_percentage || '0').toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Approvals & Alerts</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>Pending Approvals</Typography>
                  <Stack spacing={1}>
                    <Chip label={`Budget items: ${pendingBudgetApprovals.length}`} size="small" color="warning" />
                    <Chip label={`Requisitions: ${pendingRequisitions.length}`} size="small" color="warning" />
                    <Chip label={`Payments: ${pendingPayments.length}`} size="small" color="warning" />
                    <Chip label={`Cluster submissions: ${pendingClusterSubmissions.length}`} size="small" color="warning" />
                  </Stack>
                  <Button sx={{ mt: 2 }} size="small" onClick={() => navigate(`/events/${eventId}/approvals`)}>
                    Open Approval Center
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>Active Alerts</Typography>
                  <Stack spacing={1}>
                    <Chip label={`Overdue tasks: ${overdueTasks?.length || 0}`} size="small" color={(overdueTasks?.length || 0) > 0 ? 'error' : 'default'} />
                    <Chip label={`Committees at risk: ${atRiskCommittees.length}`} size="small" color={atRiskCommittees.length > 0 ? 'warning' : 'default'} />
                    <Chip
                      label={`Unsubmitted cluster funds: ${pendingClusterSubmissions.reduce((sum: number, item: any) => sum + parseFloat(item.amount || '0'), 0).toLocaleString()}`}
                      size="small"
                      color={pendingClusterSubmissions.length > 0 ? 'warning' : 'default'}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Timeline & Milestones</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Stack spacing={1.5}>
            <Chip label={`Event created: ${new Date(event.created_at).toLocaleDateString()}`} variant="outlined" />
            <Chip label={`Event date: ${new Date(event.event_date).toLocaleDateString()}`} color="primary" />
            <Chip label={`Operational progress milestone: ${parseFloat(event.operational_progress || '0').toFixed(1)}%`} variant="outlined" />
            <Chip label={`Financial progress milestone: ${parseFloat(event.financial_progress || '0').toFixed(1)}%`} variant="outlined" />
            {recentTasks.slice(0, 3).map((task: TaskPhase6) => (
              <Chip
                key={task.id}
                label={`Task update: ${task.title} (${task.status_display})`}
                variant="outlined"
                onClick={() => navigate('/tasks')}
              />
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
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
  operationalProgress: number;
  financialProgress: number;
  onRefresh: () => void;
}> = ({ event, operationalProgress, financialProgress, onRefresh }) => {
  const safeOperationalProgress = Math.min(Math.max(operationalProgress || 0, 0), 100);
  const safeFinancialProgress = Math.min(Math.max(financialProgress || 0, 0), 100);

  const eventDate = new Date(event.event_date);
  const now = new Date();
  const msDiff = eventDate.getTime() - now.getTime();
  const isEventPassed = msDiff < 0;
  const totalDays = Math.floor(Math.abs(msDiff) / (1000 * 60 * 60 * 24));
  const countdownLabel = isEventPassed
    ? `${totalDays} day${totalDays === 1 ? '' : 's'} since event`
    : `${totalDays} day${totalDays === 1 ? '' : 's'} to event`;

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
            <Chip
              icon={<EventIcon />}
              label={countdownLabel}
              color={isEventPassed ? 'default' : 'secondary'}
              variant={isEventPassed ? 'outlined' : 'filled'}
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

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <Box>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" fontWeight="medium">Overall Operational Progress</Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {safeOperationalProgress.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={safeOperationalProgress}
            color={safeOperationalProgress >= 75 ? 'success' : safeOperationalProgress >= 50 ? 'warning' : 'error'}
            sx={{ height: 10, borderRadius: 999 }}
          />
        </Box>

        <Box>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" fontWeight="medium">Overall Financial Progress</Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {safeFinancialProgress.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={safeFinancialProgress}
            color={safeFinancialProgress >= 75 ? 'success' : safeFinancialProgress >= 50 ? 'warning' : 'error'}
            sx={{ height: 10, borderRadius: 999 }}
          />
        </Box>
      </Stack>
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
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ minHeight: 116 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' }, lineHeight: 1.2 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
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

export default EventDashboard;
