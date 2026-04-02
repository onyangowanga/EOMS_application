import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Alert,
  Chip,
  LinearProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assignment,
  Group,
  Star,
  Add,
  PersonAdd,
  AttachMoney,
  CheckCircle,
  Pending,
  Cancel,
  TrendingUp,
  Warning,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { committeeService } from '../services/committee.service';
import { taskService } from '../services/task.service';
import { financeService } from '../services/finance.service';
import { eventService } from '../services/event.service';
import { useAuth } from '../contexts/AuthContext';
import type { 
  CommitteePhase6, 
  CommitteeMember, 
  EventMember,
  BudgetItem
} from '../types';

/**
 * Subcommittee Details Page - Complete implementation
 * Shows overview, tasks, members, budget, and reports for a specific subcommittee
 * Mobile-first responsive design with context-aware FAB
 */
const SubcommitteeDetailsPage: React.FC = () => {
  const { eventId, subcommitteeId } = useParams<{
    eventId: string;
    subcommitteeId: string;
  }>();
  const [currentTab, setCurrentTab] = useState(0);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    estimated_cost: '',
    deadline: '',
  });
  const [selectedMember, setSelectedMember] = useState<EventMember | null>(null);
  const [openRequisitionDialog, setOpenRequisitionDialog] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItem | null>(null);
  const [newRequisition, setNewRequisition] = useState({
    requested_amount: '',
    purpose: '',
    date_needed: '',
  });
  const [taskProgressDrafts, setTaskProgressDrafts] = useState<Record<string, number>>({});
  const [taskProgressNotice, setTaskProgressNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const { user, hasRole } = useAuth();
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch all committees for navigation
  const { data: allCommittees } = useQuery({
    queryKey: ['committees', eventId],
    queryFn: () => eventService.getEventCommittees(eventId!),
    enabled: !!eventId,
  });

  // Fetch committee details
  const { data: committee, isLoading, error } = useQuery<CommitteePhase6>({
    queryKey: ['committee', subcommitteeId],
    queryFn: async () => {
      if (!subcommitteeId) throw new Error('Committee ID is required');
      return await committeeService.getById(parseInt(subcommitteeId));
    },
    enabled: !!subcommitteeId,
  });

  // Fetch committee members
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['committee-members', subcommitteeId],
    queryFn: async () => {
      if (!subcommitteeId) return [];
      return await committeeService.getMembers(parseInt(subcommitteeId));
    },
    enabled: !!subcommitteeId,
  });

  // Fetch tasks for this committee
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['committee-tasks', subcommitteeId],
    queryFn: async () => {
      if (!subcommitteeId) return [];
      const allTasks = await taskService.getAll({ committee: parseInt(subcommitteeId) });
      return allTasks;
    },
    enabled: !!subcommitteeId,
  });

  // Fetch event members for adding to committee
  const { data: eventMembers } = useQuery({
    queryKey: ['event-members', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      return await eventService.getEventMembers(eventId);
    },
    enabled: !!eventId && openMemberDialog,
  });

  // Fetch expenses/budget items for this committee
  const { data: expenses } = useQuery({
    queryKey: ['committee-expenses', subcommitteeId],
    queryFn: async () => {
      if (!subcommitteeId) return [];
      return await financeService.getExpenses({ committee: parseInt(subcommitteeId) });
    },
    enabled: !!subcommitteeId,
  });

  // Fetch budget items for this committee
  const { data: budgetItems } = useQuery<BudgetItem[]>({
    queryKey: ['committee-budget-items', subcommitteeId],
    queryFn: async () => {
      if (!subcommitteeId) return [];
      return await committeeService.getBudgetItems(parseInt(subcommitteeId));
    },
    enabled: !!subcommitteeId,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!canCreateOperationalTasks) {
        throw new Error('You are not allowed to create operational tasks.');
      }
      return await taskService.create({
        committee_id: parseInt(subcommitteeId!),
        title: newTask.title,
        description: newTask.description,
        assigned_to_id: newTask.assigned_to ? parseInt(newTask.assigned_to) : undefined,
        priority: newTask.priority,
        estimated_cost: newTask.estimated_cost ? parseFloat(newTask.estimated_cost) : undefined,
        deadline: newTask.deadline || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committee-tasks', subcommitteeId] });
      queryClient.invalidateQueries({ queryKey: ['committee', subcommitteeId] });
      setOpenTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'MEDIUM',
        estimated_cost: '',
        deadline: '',
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMember) throw new Error('No member selected');
      return await committeeService.addMember(
        parseInt(subcommitteeId!),
        { user_id: selectedMember.user_details.id }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committee-members', subcommitteeId] });
      setOpenMemberDialog(false);
      setSelectedMember(null);
    },
  });

  /**
   * DEPRECATED: createBudgetItemMutation
   * Budget item creation moved to Finance Module (not accessible from operational subcommittees)
   * Keeping code for reference, commented out for now
   */
  // const createBudgetItemMutation = useMutation({
  //   mutationFn: async () => {
  //     if (!canCreateOperationalBudgetItems) {
  //       throw new Error('You are not allowed to create operational budget items.');
  //     }
  //     return await committeeService.createBudgetItem(
  //       parseInt(subcommitteeId!),
  //       {
  //         title: newBudgetItem.title,
  //         description: newBudgetItem.description,
  //         estimated_cost: parseFloat(newBudgetItem.estimated_cost),
  //         linked_task: newBudgetItem.linked_task ? parseInt(newBudgetItem.linked_task) : undefined,
  //       }
  //     );
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['committee-budget-items', subcommitteeId] });
  //     queryClient.invalidateQueries({ queryKey: ['committee', subcommitteeId] });
  //     setOpenBudgetDialog(false);
  //     setNewBudgetItem({
  //       title: '',
  //       description: '',
  //       estimated_cost: '',
  //       linked_task: '',
  //     });
  //   },
  // });

  const createRequisitionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBudgetItem) throw new Error('Please select a budget item');
      if (!canRequestRequisition) throw new Error('You are not allowed to request funds.');

      return await financeService.createExpense({
        event: eventId,
        committee_id: parseInt(subcommitteeId!),
        budget_item: selectedBudgetItem.id,
        vendor: `Requisition for ${selectedBudgetItem.item_name || selectedBudgetItem.title}`,
        amount: parseFloat(newRequisition.requested_amount),
        category: 'OTHER',
        description: [
          newRequisition.purpose,
          newRequisition.date_needed ? `Date needed: ${newRequisition.date_needed}` : '',
        ].filter(Boolean).join(' | '),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committee-expenses', subcommitteeId] });
      queryClient.invalidateQueries({ queryKey: ['committee-budget-items', subcommitteeId] });
      setOpenRequisitionDialog(false);
      setSelectedBudgetItem(null);
      setNewRequisition({
        requested_amount: '',
        purpose: '',
        date_needed: '',
      });
    },
  });

  const updateTaskProgressMutation = useMutation({
    mutationFn: async ({ taskId, progress }: { taskId: string; progress: number }) => {
      setUpdatingTaskId(taskId);
      return await eventService.updateTaskProgress(taskId, progress);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['committee-tasks', subcommitteeId] });
      queryClient.invalidateQueries({ queryKey: ['committee', subcommitteeId] });
      setTaskProgressNotice({
        type: 'success',
        message: `Task progress updated to ${variables.progress.toFixed(0)}%.`,
      });
      setTaskProgressDrafts((prev) => {
        const next = { ...prev };
        delete next[variables.taskId];
        return next;
      });
    },
    onError: (error: any) => {
      setTaskProgressNotice({
        type: 'error',
        message: error?.response?.data?.error || 'Failed to update task progress.',
      });
    },
    onSettled: () => {
      setUpdatingTaskId(null);
    },
  });

  if (isLoading || loadingMembers) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Skeleton variant="text" width="60%" height={50} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error || !committee) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="error">Failed to load committee details</Alert>
      </Box>
    );
  }

  const committeeName = (committee.name || '').toLowerCase();
  const isGovernanceCommittee =
    committee.is_main ||
    committeeName.includes('finance') ||
    committeeName.includes('executive');

  if (isGovernanceCommittee) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          This committee is part of governance (Officials/Finance Module), not operational subcommittees.
        </Alert>
        <Button variant="contained" onClick={() => navigate(`/events/${eventId}/subcommittees`)}>
          Back to Operational Subcommittees
        </Button>
      </Box>
    );
  }

  const liveTasks = (tasks || []) as any[];
  const activeTasks = liveTasks.filter((task) => task.status !== 'CANCELLED');
  const completedActiveTasks = activeTasks.filter((task) => task.status === 'COMPLETED').length;
  const totalActiveTasks = activeTasks.length;
  const fallbackTaskCount = Number(committee.task_count || 0);
  const totalTasksForOverview = totalActiveTasks || fallbackTaskCount;

  const completionRate = totalTasksForOverview > 0
    ? (completedActiveTasks / totalTasksForOverview) * 100
    : 0;

  const averageTaskProgress = totalActiveTasks > 0
    ? activeTasks.reduce((sum, task) => {
        const value = Math.min(Math.max(parseFloat(task.progress_percentage || '0'), 0), 100);
        return sum + value;
      }, 0) / totalActiveTasks
    : null;

  const progress = averageTaskProgress ?? completionRate;

  const isTeamLeadForThisCommittee = (members || []).some((member: any) => {
    const memberUserId = member.user?.id ?? member.user_id;
    return memberUserId === user?.id && (member.is_lead || member.role === 'TEAM_LEAD');
  });
  const canCreateOperationalTasks = isTeamLeadForThisCommittee;
  const canUpdateTaskProgress = isTeamLeadForThisCommittee;
  const canRequestRequisition = hasRole(['executive_admin', 'subcommittee_lead', 'chair', 'secretary']);

  const getTaskProgressStage = (value: number) => {
    if (value >= 100) return 'Completed';
    if (value >= 90) return 'Ready for Review';
    if (value > 0) return 'In Progress';
    return 'To-Do';
  };

  const operationalCommittees = (allCommittees || []).filter((committee: any) => {
    const committeeName = (committee.name || '').toLowerCase();
    return (
      committee.committee_type !== 'BUDGET_FINANCE' &&
      !committee.is_main &&
      !committeeName.includes('finance') &&
      !committeeName.includes('executive')
    );
  });

  // Navigation logic
  const currentIndex = operationalCommittees.findIndex(c => String(c.id) === String(subcommitteeId));
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < operationalCommittees.length - 1;

  const handleNavigatePrevious = () => {
    if (hasPrevious) {
      const prevCommittee = operationalCommittees[currentIndex - 1];
      navigate(`/events/${eventId}/subcommittees/${prevCommittee.id}`);
    }
  };

  const handleNavigateNext = () => {
    if (hasNext) {
      const nextCommittee = operationalCommittees[currentIndex + 1];
      navigate(`/events/${eventId}/subcommittees/${nextCommittee.id}`);
    }
  };

  // Calculate budget stats
  const allocatedBudget = parseFloat(committee.budget_allocation || '0');
  const usedBudget = budgetItems?.filter(item => 
    item.status === 'APPROVED' || item.status === 'COMPLETED'
  ).reduce((sum, item) => sum + parseFloat(item.allocated_amount || '0'), 0) || 0;
  const pendingBudget = budgetItems?.filter(item => 
    item.status === 'PENDING'
  ).reduce((sum, item) => sum + parseFloat(item.allocated_amount || '0'), 0) || 0;
  const remainingBudget = allocatedBudget - usedBudget - pendingBudget;

  // Legacy expense calculations (for backward compatibility in Reports tab)
  const totalBudget = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0) || 0;
  const paidBudget = expenses?.filter(exp => exp.status === 'PAID').reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0) || 0;

  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Overview
        return (
          <Box>
            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" color="primary">
                          {totalTasksForOverview}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Tasks
                        </Typography>
                      </Box>
                      <Assignment color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" color="success.main">
                          {completionRate.toFixed(0)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completion Rate
                        </Typography>
                      </Box>
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" color="info.main">
                          {members?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Team Members
                        </Typography>
                      </Box>
                      <Group color="info" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" color="warning.main">
                          KES {totalBudget.toFixed(0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Budget Allocated
                        </Typography>
                      </Box>
                      <AttachMoney color="warning" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Committee Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Committee Information
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mt: 2 }}>
                      <Box display="flex" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Type:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {committee.committee_type_display}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Lead:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {committee.lead_name || 'Not assigned'}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Members:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {members?.length || 0}
                        </Typography>
                      </Box>
                      {committee.is_main && (
                        <Chip label="Main Committee" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Operational Progress */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Operational Progress
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mt: 3 }}>
                      <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Overall Progress
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {progress.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ height: 10, borderRadius: 5, mb: 2 }}
                      />
                      <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Task Completion
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {completionRate.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={completionRate} 
                        color="success"
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Description */}
              {committee.description && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Description
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {committee.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 1: // Tasks
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Tasks ({tasks?.length || 0})
              </Typography>
            </Box>

            {taskProgressNotice && (
              <Alert
                severity={taskProgressNotice.type}
                sx={{ mb: 2 }}
                onClose={() => setTaskProgressNotice(null)}
              >
                {taskProgressNotice.message}
              </Alert>
            )}

            {!canUpdateTaskProgress && (
              <Alert severity="info" sx={{ mb: 2 }}>
                You can view task progress, but your role cannot transition progress values.
              </Alert>
            )}

            {loadingTasks ? (
              <Skeleton variant="rectangular" height={200} />
            ) : !tasks || tasks.length === 0 ? (
              <Alert severity="info">
                No tasks yet. Click the + button to create a task.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {tasks.map((task: any) => (
                  <Grid item xs={12} key={task.id}>
                    <Card>
                      <CardContent>
                        {(() => {
                          const currentProgress = Math.min(
                            Math.max(parseFloat(task.progress_percentage || '0'), 0),
                            100
                          );
                          const draftProgress = taskProgressDrafts[String(task.id)] ?? currentProgress;
                          const hasChanges = Math.abs(draftProgress - currentProgress) > 0.01;
                          const stage = getTaskProgressStage(draftProgress);
                          const quickSteps = [0, 25, 50, 75, 90, 100];

                          return (
                            <>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box flex={1}>
                            <Typography variant="h6" gutterBottom>
                              {task.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {task.description}
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                              <Chip 
                                label={task.status_display || task.status} 
                                size="small" 
                                color={
                                  task.status === 'COMPLETED' ? 'success' :
                                  task.status === 'IN_PROGRESS' ? 'primary' :
                                  'default'
                                }
                              />
                              <Chip 
                                label={task.priority_display || task.priority} 
                                size="small" 
                                color={
                                  task.priority === 'URGENT' ? 'error' :
                                  task.priority === 'HIGH' ? 'warning' :
                                  'default'
                                }
                              />
                              {task.assigned_to_name && (
                                <Chip 
                                  label={`Assigned: ${task.assigned_to_name}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                              {task.estimated_cost && (
                                <Chip
                                  label={`Est. Cost: KES ${Number(task.estimated_cost).toLocaleString()}`}
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                />
                              )}
                              {task.deadline && (
                                <Chip 
                                  label={`Due: ${new Date(task.deadline).toLocaleDateString()}`} 
                                  size="small" 
                                  variant="outlined"
                                  icon={task.is_overdue ? <Warning /> : undefined}
                                  color={task.is_overdue ? 'error' : 'default'}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                        
                        {/* Progress Transition Flow */}
                        <Box sx={{ mt: 2 }}>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                              Progress Transition
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={stage}
                                size="small"
                                color={
                                  draftProgress >= 100
                                    ? 'success'
                                    : draftProgress >= 90
                                    ? 'warning'
                                    : draftProgress > 0
                                    ? 'primary'
                                    : 'default'
                                }
                                variant="outlined"
                              />
                              <Typography variant="body2" fontWeight="bold">
                                {draftProgress.toFixed(0)}%
                              </Typography>
                            </Box>
                          </Box>

                          <Slider
                            value={draftProgress}
                            min={0}
                            max={100}
                            step={5}
                            marks={[{ value: 0, label: '0' }, { value: 50, label: '50' }, { value: 100, label: '100' }]}
                            valueLabelDisplay="auto"
                            onChange={(_, value) => {
                              const nextValue = Array.isArray(value) ? value[0] : value;
                              setTaskProgressDrafts((prev) => ({
                                ...prev,
                                [String(task.id)]: nextValue,
                              }));
                            }}
                            disabled={!canUpdateTaskProgress || updateTaskProgressMutation.isPending}
                            sx={{ mb: 1 }}
                          />

                          <LinearProgress 
                            variant="determinate" 
                            value={draftProgress} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />

                          <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                            {quickSteps.map((step) => (
                              <Button
                                key={step}
                                size="small"
                                variant={Math.abs(draftProgress - step) < 0.01 ? 'contained' : 'outlined'}
                                onClick={() =>
                                  setTaskProgressDrafts((prev) => ({
                                    ...prev,
                                    [String(task.id)]: step,
                                  }))
                                }
                                disabled={!canUpdateTaskProgress || updateTaskProgressMutation.isPending}
                              >
                                {step}%
                              </Button>
                            ))}
                          </Box>

                          <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() =>
                                updateTaskProgressMutation.mutate({
                                  taskId: String(task.id),
                                  progress: draftProgress,
                                })
                              }
                              disabled={
                                !canUpdateTaskProgress ||
                                !hasChanges ||
                                updateTaskProgressMutation.isPending
                              }
                            >
                              {updateTaskProgressMutation.isPending && updatingTaskId === String(task.id)
                                ? 'Saving...'
                                : 'Save Transition'}
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => {
                                setTaskProgressDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[String(task.id)];
                                  return next;
                                });
                              }}
                              disabled={!hasChanges || updateTaskProgressMutation.isPending}
                            >
                              Reset
                            </Button>
                          </Box>
                        </Box>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 2: // Members
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Members ({members?.length || 0})
              </Typography>
            </Box>

            <List>
              {!members || members.length === 0 ? (
                <Alert severity="info">
                  No members yet. Click the + button to add members.
                </Alert>
              ) : (
                members.map((member: CommitteeMember) => (
                  <Paper key={member.id} sx={{ mb: 2 }}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: member.is_lead ? 'warning.main' : 'primary.main' }}>
                          {member.user.full_name?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {member.user.full_name || member.user.phone}
                            </Typography>
                            {member.is_lead && (
                              <Chip 
                                icon={<Star />} 
                                label="Lead" 
                                size="small" 
                                color="warning" 
                              />
                            )}
                            {member.role_display && member.role_display !== 'Member' && (
                              <Chip 
                                label={member.role_display} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box component="span">
                            <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.875rem' }}>
                              {member.user.phone}
                            </Box>
                            {member.role_description && (
                              <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
                                {member.role_description}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))
              )}
            </List>
          </Box>
        );

      case 3: // Budget
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6">
                  Budget Allocation
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Allocated budget and items for this subcommittee only
                </Typography>
              </Box>
            </Box>

            {/* Info Banner: Budget Management in Finance Module */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                💡 <strong>Budget management</strong> is handled in the Finance Module (accessible from Event Dashboard). 
                This view shows only your allocated budget and items.
              </Typography>
            </Alert>

            {/* Budget Overview Cards - Subcommittee View Only */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Allocated Budget
                    </Typography>
                    <Typography variant="h5" color="primary">
                      KES {allocatedBudget.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total available
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Used / Pending
                    </Typography>
                    <Typography variant="h5" color="warning.main">
                      KES {(usedBudget + pendingBudget).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Spent + Awaiting budget items
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Remaining
                    </Typography>
                    <Typography variant="h5" color={remainingBudget > 0 ? "success.main" : "error.main"}>
                      KES {remainingBudget.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Available to use
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Utilization
                    </Typography>
                    <Typography variant="h5" color="info.main">
                      {allocatedBudget > 0 ? (((usedBudget + pendingBudget) / allocatedBudget) * 100).toFixed(0) : '0'}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={allocatedBudget > 0 ? Math.min(((usedBudget + pendingBudget) / allocatedBudget) * 100, 100) : 0}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Budget Items List - Read-Only */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Approved Budget Items
            </Typography>
            {!budgetItems || budgetItems.length === 0 ? (
              <Alert severity="info">
                No approved budget items yet. Contact Finance Committee to review and approve budget items.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Item</strong></TableCell>
                      <TableCell align="right"><strong>Amount</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Linked Task</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgetItems.map((item: BudgetItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.item_name || item.title}
                          </Typography>
                          {item.description && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {item.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            KES {parseFloat(item.allocated_amount).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.status} 
                            size="small"
                            color={
                              item.status === 'APPROVED' || item.status === 'COMPLETED' ? 'success' :
                              item.status === 'PENDING' ? 'warning' :
                              'error'
                            }
                            icon={
                              item.status === 'APPROVED' || item.status === 'COMPLETED' ? <CheckCircle /> :
                              item.status === 'PENDING' ? <Pending /> :
                              item.status === 'REJECTED' ? <Cancel /> :
                              undefined
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          {item.linked_task_title ? (
                            <Typography variant="body2" color="primary">
                              {item.linked_task_title}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {(item.status === 'APPROVED' || item.status === 'COMPLETED') && canRequestRequisition ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => {
                                setSelectedBudgetItem(item);
                                setOpenRequisitionDialog(true);
                              }}
                            >
                              Request Funds
                            </Button>
                          ) : item.status === 'PENDING' ? (
                            <Typography variant="caption" color="text.secondary">
                              Awaiting approval
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        );

      case 4: // Reports
        return (
          <Box>
            <Typography variant="h6" gutterBottom mb={3}>
              Reports & Analytics
            </Typography>

            <Grid container spacing={3}>
              {/* Task Progress Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Task Progress Overview
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mt: 2 }}>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2">Total Tasks</Typography>
                        <Typography variant="h6">{committee.task_count || 0}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2">Completed</Typography>
                        <Typography variant="h6" color="success.main">
                          {committee.tasks_completed || 0}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2">Completion Rate</Typography>
                        <Typography variant="h6" color="primary">
                          {completionRate.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={completionRate} 
                        sx={{ height: 12, borderRadius: 6, mt: 2 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Budget Usage Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Budget Usage
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mt: 2 }}>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2">Total Budget</Typography>
                        <Typography variant="h6">KES {totalBudget.toFixed(0)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2">Utilized (Paid)</Typography>
                        <Typography variant="h6" color="info.main">
                          KES {paidBudget.toFixed(0)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2">Utilization Rate</Typography>
                        <Typography variant="h6" color="warning.main">
                          {totalBudget > 0 ? ((paidBudget / totalBudget) * 100).toFixed(1) : 0}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={totalBudget > 0 ? (paidBudget / totalBudget) * 100 : 0} 
                        color="warning"
                        sx={{ height: 12, borderRadius: 6, mt: 2 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Team Performance */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Team Performance
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <TrendingUp sx={{ fontSize: 48, color: 'success.main' }} />
                          <Typography variant="h4" color="success.main">
                            {progress.toFixed(0)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Overall Progress
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <Group sx={{ fontSize: 48, color: 'primary.main' }} />
                          <Typography variant="h4" color="primary">
                            {members?.length || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Active Members
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <Assignment sx={{ fontSize: 48, color: 'info.main' }} />
                          <Typography variant="h4" color="info.main">
                            {committee.task_count || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Tasks
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  const handleFabClick = () => {
    switch (currentTab) {
      case 1: // Tasks tab
        if (canCreateOperationalTasks) setOpenTaskDialog(true);
        break;
      case 2: // Members tab
        setOpenMemberDialog(true);
        break;
      case 3: // Budget tab - No FAB for budget management (moved to Finance Module)
        break;
      default:
        break;
    }
  };

  const getFabIcon = () => {
    switch (currentTab) {
      case 1:
        return <Add />;
      case 2:
        return <PersonAdd />;
      case 3:
        return null; // No FAB for Budget tab
      default:
        return <Add />;
    }
  };

  const getFabLabel = () => {
    switch (currentTab) {
      case 1:
        return 'Add Task';
      case 2:
        return 'Add Member';
      case 3:
        return ''; // No FAB for Budget tab
      default:
        return '';
    }
  };

  const showFab =
    (currentTab === 1 && canCreateOperationalTasks) ||
    currentTab === 2;
    // Budget tab (case 3) no longer shows FAB - budget management moved to Finance Module

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header with Committee Name and Progress */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        {/* Committee Name with Navigation */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Tooltip title="Previous Committee">
            <span>
              <IconButton 
                onClick={handleNavigatePrevious} 
                disabled={!hasPrevious}
                size="small"
              >
                <ArrowBack />
              </IconButton>
            </span>
          </Tooltip>
          
          <Box flex={1}>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {committee.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {committee.committee_type_display}
            </Typography>
          </Box>
          
          <Tooltip title="Next Committee">
            <span>
              <IconButton 
                onClick={handleNavigateNext} 
                disabled={!hasNext}
                size="small"
              >
                <ArrowForward />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">
              Lead: <strong>{committee.lead_name || 'Not assigned'}</strong>
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">
              Members: <strong>{members?.length || 0}</strong>
            </Typography>
          </Box>
        </Box>
        
        {/* Operational Progress Bar */}
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" fontWeight="medium">
              Operational Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {progress.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 12, borderRadius: 6 }}
          />
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Tasks" />
          <Tab label="Members" />
          <Tab label="Budget" />
          <Tab label="Reports" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ px: { xs: 0, sm: 0 } }}>
        {renderTabContent()}
      </Box>

      {/* Context-Aware FAB */}
      {showFab && (
        <Fab
          color="primary"
          aria-label={getFabLabel()}
          onClick={handleFabClick}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
          }}
        >
          {getFabIcon()}
        </Fab>
      )}

      {/* Add Task Dialog */}
      <Dialog 
        open={openTaskDialog} 
        onClose={() => setOpenTaskDialog(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Title"
            fullWidth
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Priority"
            fullWidth
            select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
          >
            <MenuItem value="LOW">Low</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="URGENT">Urgent</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Deadline"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newTask.deadline}
            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Estimated Cost (Optional)"
            type="number"
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
            value={newTask.estimated_cost}
            onChange={(e) => setNewTask({ ...newTask, estimated_cost: e.target.value })}
            helperText="If provided, a budget item will be created automatically."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => createTaskMutation.mutate()} 
            variant="contained"
            disabled={!newTask.title || createTaskMutation.isPending}
          >
            {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog 
        open={openMemberDialog} 
        onClose={() => setOpenMemberDialog(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Committee Member</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
            Select an event member to add to this committee
          </Typography>
          <Autocomplete
            options={eventMembers?.filter(em => 
              !members?.some(m => m.user.id === em.user_details.id)
            ) || []}
            getOptionLabel={(option) => option.user_details.full_name || option.user_details.phone}
            value={selectedMember}
            onChange={(_, newValue) => setSelectedMember(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Member" margin="normal" />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body1">
                    {option.user_details.full_name || option.user_details.phone}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.role_display} • {option.user_details.phone}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMemberDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => addMemberMutation.mutate()} 
            variant="contained"
            disabled={!selectedMember || addMemberMutation.isPending}
          >
            {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Requisition Dialog */}
      <Dialog
        open={openRequisitionDialog}
        onClose={() => setOpenRequisitionDialog(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Funds</DialogTitle>
        <DialogContent>
          {selectedBudgetItem && (
            <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
              Budget Item: {selectedBudgetItem.item_name || selectedBudgetItem.title} (KES {Number(selectedBudgetItem.allocated_amount || 0).toLocaleString()})
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Requested Amount (KES) *"
            type="number"
            fullWidth
            inputProps={{ min: 0.01, step: '0.01' }}
            value={newRequisition.requested_amount}
            onChange={(e) => setNewRequisition({ ...newRequisition, requested_amount: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Purpose *"
            fullWidth
            multiline
            rows={3}
            value={newRequisition.purpose}
            onChange={(e) => setNewRequisition({ ...newRequisition, purpose: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Date Needed"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newRequisition.date_needed}
            onChange={(e) => setNewRequisition({ ...newRequisition, date_needed: e.target.value })}
          />

          <Alert severity="warning" sx={{ mt: 2 }}>
            Requisition flow: Pending → Chair Approval → Treasurer Approval → Finance Approval → Paid
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequisitionDialog(false)}>Cancel</Button>
          <Button
            onClick={() => createRequisitionMutation.mutate()}
            variant="contained"
            disabled={!newRequisition.requested_amount || !newRequisition.purpose || createRequisitionMutation.isPending}
          >
            {createRequisitionMutation.isPending ? 'Submitting...' : 'Submit Requisition'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubcommitteeDetailsPage;
