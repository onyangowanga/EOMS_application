import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Stack,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as ApproveIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  PendingActions as PendingIcon,
  RequestPage as RequestFundsIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { eventService } from '../services/event.service';
import { financeService } from '../services/finance.service';
import { useAuth } from '../contexts/AuthContext';
import type { ExpensePhase6, BudgetItem } from '../types';

/**
 * BudgetManagementPage - Comprehensive budget tracking and approval workflow
 * 
 * Features:
 * - Budget items list with allocation tracking
 * - Spent vs allocated visualization
 * - Auto-logged activities pending approval
 * - Approval/rejection workflow
 * - Create new budget items
 * - Mobile-responsive design
 */

interface BudgetFormData {
  item_name: string;
  category: string;
  allocated_amount: string;
  committee?: string;
  description?: string;
}

const BudgetManagementPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [createDialog, setCreateDialog] = useState(false);
  const [formData, setFormData] = useState<BudgetFormData>({
    item_name: '',
    category: '',
    allocated_amount: '',
    committee: undefined,
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<ExpensePhase6 | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItem | null>(null);
  const [openRequisitionDialog, setOpenRequisitionDialog] = useState(false);
  const [newRequisition, setNewRequisition] = useState({
    requested_amount: '',
    purpose: '',
    date_needed: '',
  });

  // Fetch data
  const { data: budgetItems, isLoading: loadingBudget } = useQuery({
    queryKey: ['budget-items', eventId],
    queryFn: () => eventService.getEventBudgetItems(eventId!),
    enabled: !!eventId,
  });

  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses', eventId],
    queryFn: () => eventService.getEventExpenses(eventId!),
    enabled: !!eventId,
  });

  const { data: financialSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financial-summary', eventId],
    queryFn: () => eventService.getFinancialSummary(eventId!),
    enabled: !!eventId,
  });

  const { data: eventMembers } = useQuery({
    queryKey: ['event-members', eventId],
    queryFn: () => eventService.getEventMembers(eventId!),
    enabled: !!eventId,
  });

  const normalizedExpenses: ExpensePhase6[] = Array.isArray(expenses)
    ? expenses
    : ((expenses as any)?.results || []);

  const normalizedBudgetItems: BudgetItem[] = Array.isArray(budgetItems)
    ? budgetItems
    : ((budgetItems as any)?.results || []);

  const currentEventRole = eventMembers?.find((member: any) => member.user_details?.id === user?.id)?.role;
  const canAllocateBudget = hasRole(['executive_admin', 'finance_member', 'chair', 'treasurer']);

  const canApproveAsChair = hasRole(['executive_admin', 'chair']);
  const canApproveAsTreasurer = hasRole(['executive_admin', 'treasurer']);
  const canApproveAsFinance = hasRole(['executive_admin', 'finance_member']);
  const canReviewBudgetItems = canApproveAsChair || canApproveAsTreasurer || canApproveAsFinance;
  const canRequestRequisition = hasRole(['executive_admin', 'subcommittee_lead', 'chair', 'secretary']);

  // Create budget item mutation
  const createBudgetMutation = useMutation({
    mutationFn: (data: any) => eventService.createBudgetItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] });
      handleCloseCreateDialog();
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message || 'Failed to create budget item');
    },
  });

  const approveChairMutation = useMutation({
    mutationFn: (expenseId: string) => eventService.approveAsChair(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
      handleCloseApprovalDialog();
    },
  });

  const approveTreasurerMutation = useMutation({
    mutationFn: (expenseId: string) => eventService.approveAsTreasurer(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
      handleCloseApprovalDialog();
    },
  });

  const approveFinanceMutation = useMutation({
    mutationFn: (expenseId: string) => eventService.approveAsFinance(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
      handleCloseApprovalDialog();
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (expenseId: string) => eventService.markExpensePaid(expenseId, 'BANK', 'AUTO-FRONTEND'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary', eventId] });
      handleCloseApprovalDialog();
    },
  });

  const approveBudgetMutation = useMutation({
    mutationFn: (budgetItemId: string) => eventService.approveBudgetItem(budgetItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', eventId] });
    },
  });

  const rejectBudgetMutation = useMutation({
    mutationFn: (budgetItemId: string) => eventService.rejectBudgetItem(budgetItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', eventId] });
    },
  });

  const createRequisitionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBudgetItem) {
        throw new Error('Please select a budget item');
      }

      return financeService.createExpense({
        event: eventId,
        committee_id: selectedBudgetItem.committee,
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
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
      setOpenRequisitionDialog(false);
      setSelectedBudgetItem(null);
      setNewRequisition({
        requested_amount: '',
        purpose: '',
        date_needed: '',
      });
    },
  });

  // Handlers
  const handleOpenCreateDialog = () => {
    if (!canAllocateBudget) {
      return;
    }
    setFormData({
      item_name: '',
      category: '',
      allocated_amount: '',
      committee: undefined,
      description: '',
    });
    setFormError('');
    setCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialog(false);
    setFormData({
      item_name: '',
      category: '',
      allocated_amount: '',
      committee: undefined,
      description: '',
    });
    setFormError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.item_name.trim()) {
      setFormError('Budget item name is required');
      return;
    }
    if (!formData.category.trim()) {
      setFormError('Category is required');
      return;
    }
    if (!formData.allocated_amount || parseFloat(formData.allocated_amount) <= 0) {
      setFormError('Allocated amount must be greater than 0');
      return;
    }

    // Prepare data
    const submitData = {
      event: eventId!,
      item_name: formData.item_name.trim(),
      category: formData.category.trim(),
      allocated_amount: formData.allocated_amount,
      committee: formData.committee,
      description: formData.description?.trim() || '',
    };

    createBudgetMutation.mutate(submitData);
  };

  const handleViewExpense = (expense: ExpensePhase6) => {
    setSelectedExpense(expense);
    setApprovalDialog(true);
  };

  const handleOpenRequisitionDialog = (budgetItem: BudgetItem) => {
    setSelectedBudgetItem(budgetItem);
    setNewRequisition({
      requested_amount: '',
      purpose: '',
      date_needed: '',
    });
    setOpenRequisitionDialog(true);
  };

  const handleCloseApprovalDialog = () => {
    setApprovalDialog(false);
    setSelectedExpense(null);
  };

  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KSH ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateBudgetUtilization = (allocated: number, spent: number): number => {
    return allocated > 0 ? (spent / allocated) * 100 : 0;
  };

  const getUtilizationColor = (percentage: number): 'error' | 'warning' | 'success' | 'primary' => {
    if (percentage >= 100) return 'error';
    if (percentage >= 80) return 'warning';
    if (percentage >= 50) return 'success';
    return 'primary';
  };

  // Get pending approval expenses
  const pendingExpenses = normalizedExpenses.filter(
    (expense: ExpensePhase6) => !expense.is_fully_approved && expense.status !== 'REJECTED'
  );
  const totalBudget = normalizedBudgetItems.reduce(
    (sum, item) => sum + parseFloat(item.allocated_amount || '0'),
    0
  );
  const totalAvailableFunds = parseFloat(financialSummary?.collections?.total || '0');

  // Loading state
  if (loadingBudget || loadingExpenses || loadingSummary) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
              Budget & Finance Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track budget allocations, spending, and approve activities
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            disabled={!canAllocateBudget}
            fullWidth={isMobile}
            sx={{ minHeight: 48 }}
          >
            Create Budget Item
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      {financialSummary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MoneyIcon color="primary" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Total Budget
                    </Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                    {formatCurrency(totalBudget)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Available Funds
                    </Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                    {formatCurrency(totalAvailableFunds)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AssessmentIcon color="warning" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Spent
                    </Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                    {formatCurrency(financialSummary.expenses.total)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PendingIcon color="info" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Pending Approval
                    </Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold" color="warning.main">
                    {pendingExpenses.length}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Budget Items Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Budget Items
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  {!isMobile && <TableCell>Category</TableCell>}
                  <TableCell align="right">Allocated</TableCell>
                  <TableCell align="right">Spent</TableCell>
                  {!isMobile && <TableCell>Utilization</TableCell>}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {normalizedBudgetItems.length > 0 ? (
                  normalizedBudgetItems.map((item: BudgetItem) => {
                    const allocated = parseFloat(item.allocated_amount || '0');
                    const spent = parseFloat(item.spent_amount || '0');
                    const utilization = calculateBudgetUtilization(allocated, spent);

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {item.item_name}
                          </Typography>
                          {isMobile && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {item.status}
                            </Typography>
                          )}
                        </TableCell>
                        {!isMobile && (
                          <TableCell>
                            <Chip label={item.status} size="small" variant="outlined" color={
                              item.status === 'APPROVED' ? 'success' :
                              item.status === 'REJECTED' ? 'error' :
                              item.status === 'COMPLETED' ? 'primary' : 'default'
                            } />
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(allocated)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                          {formatCurrency(spent)}
                        </TableCell>
                        {!isMobile && (
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography variant="caption">
                                {utilization.toFixed(1)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(utilization, 100)}
                                color={getUtilizationColor(utilization)}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Stack>
                          </TableCell>
                        )}
                        <TableCell align="center">
                          <Stack direction={isMobile ? 'column' : 'row'} spacing={1} justifyContent="center">
                            {(item.status === 'APPROVED' || item.status === 'COMPLETED') && canRequestRequisition && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<RequestFundsIcon />}
                                onClick={() => handleOpenRequisitionDialog(item)}
                              >
                                Request Funds
                              </Button>
                            )}
                            {item.status === 'PENDING' && canReviewBudgetItems && (
                              <>
                                <Tooltip title="Approve budget item">
                                  <span>
                                    <Button
                                      size="small"
                                      color="success"
                                      variant="contained"
                                      startIcon={<ApproveIcon />}
                                      onClick={() => approveBudgetMutation.mutate(String(item.id))}
                                      disabled={approveBudgetMutation.isPending || rejectBudgetMutation.isPending}
                                    >
                                      Approve
                                    </Button>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Reject budget item">
                                  <span>
                                    <Button
                                      size="small"
                                      color="error"
                                      variant="outlined"
                                      startIcon={<RejectIcon />}
                                      onClick={() => rejectBudgetMutation.mutate(String(item.id))}
                                      disabled={approveBudgetMutation.isPending || rejectBudgetMutation.isPending}
                                    >
                                      Reject
                                    </Button>
                                  </span>
                                </Tooltip>
                              </>
                            )}
                            {item.status === 'PENDING' && !canReviewBudgetItems && (
                              <Typography variant="caption" color="text.secondary">
                                Awaiting approval
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 4 : 6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No budget items created yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Pending Approval Activities */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Pending Approval
            </Typography>
            <Chip
              label={`${pendingExpenses.length} activities`}
              color="warning"
              size="small"
            />
          </Stack>

          {pendingExpenses.length > 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              {pendingExpenses.length} auto-logged {pendingExpenses.length === 1 ? 'activity needs' : 'activities need'} review
            </Alert>
          ) : null}

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>Budget Item</TableCell>
                  {!isMobile && <TableCell>Description</TableCell>}
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingExpenses.length > 0 ? (
                  pendingExpenses.map((expense: ExpensePhase6) => (
                    <TableRow key={expense.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {expense.budget_item_name || 'General'}
                        </Typography>
                        {isMobile && expense.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {expense.description.substring(0, 30)}...
                          </Typography>
                        )}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {expense.description || '-'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Chip
                            label={expense.status_display || expense.status}
                            size="small"
                            color="warning"
                          />
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {expense.approved_by_chair && (
                              <Chip label="Chair ✓" size="small" color="success" sx={{ fontSize: '0.7rem' }} />
                            )}
                            {expense.approved_by_treasurer && (
                              <Chip label="Treasurer ✓" size="small" color="success" sx={{ fontSize: '0.7rem' }} />
                            )}
                            {expense.approved_by_finance && (
                              <Chip label="Finance ✓" size="small" color="success" sx={{ fontSize: '0.7rem' }} />
                            )}
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        {(canApproveAsChair || canApproveAsTreasurer || canApproveAsFinance) && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewExpense(expense)}
                            sx={{ minHeight: 32 }}
                          >
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 4 : 5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No pending approvals
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Budget Item Dialog */}
      <Dialog
        open={createDialog}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Create Budget Item</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}

            <TextField
              name="item_name"
              label="Item Name"
              value={formData.item_name}
              onChange={handleInputChange}
              fullWidth
              required
              placeholder="e.g., Venue Rental, Catering, Transport"
            />

            <TextField
              name="category"
              label="Category"
              value={formData.category}
              onChange={handleInputChange}
              fullWidth
              required
              placeholder="e.g., Logistics, Food, Transport"
            />

            <TextField
              name="allocated_amount"
              label="Allocated Amount (KSH)"
              type="number"
              value={formData.allocated_amount}
              onChange={handleInputChange}
              fullWidth
              required
              inputProps={{ min: 0, step: '0.01' }}
              placeholder="e.g., 200000"
            />

            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              placeholder="Additional details about this budget item..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseCreateDialog} sx={{ minHeight: 40 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createBudgetMutation.isPending}
            sx={{ minHeight: 40 }}
          >
            {createBudgetMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expense Review Dialog */}
      <Dialog
        open={approvalDialog}
        onClose={handleCloseApprovalDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Review Expense</DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Budget Item
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedExpense.budget_item_name || 'General'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(selectedExpense.amount)}
                </Typography>
              </Box>
              {selectedExpense.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedExpense.description}
                  </Typography>
                </Box>
              )}
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Approval Status
                </Typography>
                <Stack spacing={1}>
                  <Chip
                    icon={selectedExpense.approved_by_chair ? <ApproveIcon /> : <PendingIcon />}
                    label={`Chairman: ${selectedExpense.approved_by_chair ? selectedExpense.chair_name || 'Approved' : 'Pending'}`}
                    color={selectedExpense.approved_by_chair ? 'success' : 'default'}
                    variant={selectedExpense.approved_by_chair ? 'filled' : 'outlined'}
                  />
                  <Chip
                    icon={selectedExpense.approved_by_treasurer ? <ApproveIcon /> : <PendingIcon />}
                    label={`Treasurer: ${selectedExpense.approved_by_treasurer ? selectedExpense.treasurer_name || 'Approved' : 'Pending'}`}
                    color={selectedExpense.approved_by_treasurer ? 'success' : 'default'}
                    variant={selectedExpense.approved_by_treasurer ? 'filled' : 'outlined'}
                  />
                  <Chip
                    icon={selectedExpense.approved_by_finance ? <ApproveIcon /> : <PendingIcon />}
                    label={`Finance: ${selectedExpense.approved_by_finance ? selectedExpense.finance_name || 'Approved' : 'Pending'}`}
                    color={selectedExpense.approved_by_finance ? 'success' : 'default'}
                    variant={selectedExpense.approved_by_finance ? 'filled' : 'outlined'}
                  />
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {selectedExpense && selectedExpense.status === 'PENDING' && canApproveAsChair && (
            <Button
              onClick={() => approveChairMutation.mutate(String(selectedExpense.id))}
              variant="contained"
              color="primary"
            >
              Approve as Chair
            </Button>
          )}
          {selectedExpense && selectedExpense.status === 'APPROVED_CHAIR' && canApproveAsTreasurer && (
            <Button
              onClick={() => approveTreasurerMutation.mutate(String(selectedExpense.id))}
              variant="contained"
              color="primary"
            >
              Approve as Treasurer
            </Button>
          )}
          {selectedExpense && selectedExpense.status === 'APPROVED_TREASURER' && canApproveAsFinance && (
            <Button
              onClick={() => approveFinanceMutation.mutate(String(selectedExpense.id))}
              variant="contained"
              color="primary"
            >
              Approve as Finance
            </Button>
          )}
          {selectedExpense && ['FULLY_APPROVED', 'APPROVED_FINANCE'].includes(selectedExpense.status as string) && canApproveAsTreasurer && (
            <Button
              onClick={() => markPaidMutation.mutate(String(selectedExpense.id))}
              variant="contained"
              color="success"
            >
              Mark as Paid
            </Button>
          )}
          <Button onClick={handleCloseApprovalDialog} sx={{ minHeight: 40 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRequisitionDialog}
        onClose={() => setOpenRequisitionDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Request Funds</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedBudgetItem && (
              <Alert severity="info">
                Creating a requisition against <strong>{selectedBudgetItem.item_name}</strong>
              </Alert>
            )}
            <TextField
              label="Requested Amount (KSH)"
              type="number"
              fullWidth
              value={newRequisition.requested_amount}
              onChange={(e) => setNewRequisition({ ...newRequisition, requested_amount: e.target.value })}
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              label="Purpose"
              fullWidth
              multiline
              rows={3}
              value={newRequisition.purpose}
              onChange={(e) => setNewRequisition({ ...newRequisition, purpose: e.target.value })}
            />
            <TextField
              label="Date Needed"
              type="date"
              fullWidth
              value={newRequisition.date_needed}
              onChange={(e) => setNewRequisition({ ...newRequisition, date_needed: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenRequisitionDialog(false)}>Cancel</Button>
          <Button
            onClick={() => createRequisitionMutation.mutate()}
            variant="contained"
            disabled={
              !newRequisition.requested_amount ||
              !newRequisition.purpose ||
              createRequisitionMutation.isPending
            }
          >
            {createRequisitionMutation.isPending ? 'Submitting...' : 'Submit Requisition'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetManagementPage;
