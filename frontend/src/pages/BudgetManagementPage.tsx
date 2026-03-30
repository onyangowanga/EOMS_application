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
  Paper,
  Button,
  IconButton,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import { eventService } from '../services/event.service';
import type { ExpensePhase6 } from '../types';

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

  // Handlers
  const handleOpenCreateDialog = () => {
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
  const pendingExpenses = expenses?.filter(e => !e.is_fully_approved && e.status !== 'REJECTED') || [];

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
                    KSH 2,000,000
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
                      Allocated
                    </Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                    KSH 1,800,000
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
                </TableRow>
              </TableHead>
              <TableBody>
                {budgetItems && budgetItems.length > 0 ? (
                  budgetItems.map((item) => {
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
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 3 : 5} align="center" sx={{ py: 4 }}>
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
                  pendingExpenses.map((expense) => (
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
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewExpense(expense)}
                          sx={{ minHeight: 32 }}
                        >
                          Review
                        </Button>
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
          <Button onClick={handleCloseApprovalDialog} sx={{ minHeight: 40 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetManagementPage;
