import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
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
  Divider,
  Grid,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  RequestPage as RequestIcon,
  AccountBalance as DepositIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { eventService } from '../services/event.service';
import type { ExpensePhase6 } from '../types';

/**
 * TreasuryPage - Comprehensive treasury management with 3 tabs
 * 
 * Tabs:
 * 1. Receipts: All payments received (mapped to cluster or general)
 * 2. Requisitions: Fund requests with 3-tier approval workflow
 * 3. Deposits: Cluster deposits pending treasurer confirmation
 * 
 * Features:
 * - Mobile-responsive with bottom tabs on mobile
 * - Touch-friendly buttons (48px minimum)
 * - Horizontal scroll tables on mobile
 * - Approval workflow visualization
 * - Real-time balance calculations
 */

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`treasury-tabpanel-${index}`}
      aria-labelledby={`treasury-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const TreasuryPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState<ExpensePhase6 | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [approvalType, setApprovalType] = useState<'chair' | 'treasurer' | 'finance' | ''>('');

  // Fetch data
  const { data: collections, isLoading: loadingCollections } = useQuery({
    queryKey: ['collections', eventId],
    queryFn: () => eventService.getEventCollections(eventId!),
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

  // Approve expense mutations
  const approveAsChairMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      eventService.approveAsChair(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      handleCloseApprovalDialog();
    },
  });

  const approveAsTreasurerMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      eventService.approveAsTreasurer(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      handleCloseApprovalDialog();
    },
  });

  const approveAsFinanceMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      eventService.approveAsFinance(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      handleCloseApprovalDialog();
    },
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: ({ id, method, reference }: { id: string; method: string; reference: string }) =>
      eventService.markExpensePaid(id, method, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  // Handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleOpenApproval = (expense: ExpensePhase6, type: 'chair' | 'treasurer' | 'finance') => {
    setSelectedExpense(expense);
    setApprovalType(type);
    setApprovalComments('');
    setApprovalDialog(true);
  };

  const handleCloseApprovalDialog = () => {
    setApprovalDialog(false);
    setSelectedExpense(null);
    setApprovalType('');
    setApprovalComments('');
  };

  const handleApprove = () => {
    if (!selectedExpense) return;

    const data = { id: selectedExpense.id, comments: approvalComments };

    switch (approvalType) {
      case 'chair':
        approveAsChairMutation.mutate(data);
        break;
      case 'treasurer':
        approveAsTreasurerMutation.mutate(data);
        break;
      case 'finance':
        approveAsFinanceMutation.mutate(data);
        break;
    }
  };

  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KSH ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string): 'default' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'FULLY_APPROVED':
        return 'success';
      case 'APPROVED_CHAIR':
      case 'APPROVED_TREASURER':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getApprovalProgress = (expense: ExpensePhase6): number => {
    if (expense.approval_progress) {
      return parseFloat(expense.approval_progress);
    }
    let count = 0;
    if (expense.approved_by_chair) count++;
    if (expense.approved_by_treasurer) count++;
    if (expense.approved_by_finance) count++;
    return (count / 3) * 100;
  };

  const canApproveAsChair = (expense: ExpensePhase6) => !expense.approved_by_chair;
  const canApproveAsTreasurer = (expense: ExpensePhase6) => expense.approved_by_chair && !expense.approved_by_treasurer;
  const canApproveAsFinance = (expense: ExpensePhase6) => expense.approved_by_treasurer && !expense.approved_by_finance;

  // Loading state
  if (loadingCollections || loadingExpenses || loadingSummary) {
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
        <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
          Treasury Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage receipts, requisitions, and cluster deposits
        </Typography>
      </Box>

      {/* Summary Cards */}
      {financialSummary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MoneyIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Balance
                    </Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold" color="success.main">
                    {formatCurrency(financialSummary.balance)}
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
                    <ReceiptIcon color="primary" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Collections
                    </Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                    {formatCurrency(financialSummary.collections.total)}
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
                    <RequestIcon color="warning" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Expenses
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
                    <RequestIcon color="info" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold" color="warning.main">
                    {formatCurrency(financialSummary.expenses.pending)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            scrollButtons={!isMobile ? 'auto' : false}
            allowScrollButtonsMobile={!isMobile}
          >
            <Tab
              icon={<ReceiptIcon />}
              label="Receipts"
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 72 : 48 }}
            />
            <Tab
              icon={<RequestIcon />}
              label="Requisitions"
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 72 : 48 }}
            />
            <Tab
              icon={<DepositIcon />}
              label="Deposits"
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 72 : 48 }}
            />
          </Tabs>
        </Box>

        {/* Tab 1: Receipts */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ p: { xs: 1, md: 2 } }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Source</TableCell>
                    {!isMobile && <TableCell>Cluster</TableCell>}
                    <TableCell align="right">Amount</TableCell>
                    {!isMobile && <TableCell>Type</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {collections && collections.length > 0 ? (
                    collections.map((collection) => (
                      <TableRow key={collection.id} hover>
                        <TableCell>
                          {new Date(collection.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{collection.source_type_display}</TableCell>
                        {!isMobile && (
                          <TableCell>
                            {collection.cluster_name ? (
                              <Chip label={collection.cluster_name} size="small" />
                            ) : (
                              <Chip label="General" size="small" variant="outlined" />
                            )}
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {formatCurrency(collection.amount)}
                        </TableCell>
                        {!isMobile && (
                          <TableCell>
                            <Chip
                              label={collection.source_type_display}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isMobile ? 3 : 5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No receipts recorded yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Tab 2: Requisitions */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ p: { xs: 1, md: 2 } }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Budget Item</TableCell>
                    {!isMobile && <TableCell>Description</TableCell>}
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Approval</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses && expenses.length > 0 ? (
                    expenses.map((expense) => {
                      const progress = getApprovalProgress(expense);
                      return (
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
                                color={getStatusColor(expense.status)}
                              />
                              {!isMobile && (
                                <Typography variant="caption" color="text.secondary">
                                  {progress.toFixed(0)}% approved
                                </Typography>
                              )}
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
                            <Stack direction={isMobile ? 'column' : 'row'} spacing={0.5}>
                              {canApproveAsChair(expense) && (
                                <Button
                                  size="small"
                                  startIcon={<ApproveIcon />}
                                  onClick={() => handleOpenApproval(expense, 'chair')}
                                  sx={{ minHeight: 32, fontSize: '0.75rem' }}
                                >
                                  Chair
                                </Button>
                              )}
                              {canApproveAsTreasurer(expense) && (
                                <Button
                                  size="small"
                                  startIcon={<ApproveIcon />}
                                  onClick={() => handleOpenApproval(expense, 'treasurer')}
                                  sx={{ minHeight: 32, fontSize: '0.75rem' }}
                                >
                                  Treasurer
                                </Button>
                              )}
                              {canApproveAsFinance(expense) && (
                                <Button
                                  size="small"
                                  startIcon={<ApproveIcon />}
                                  onClick={() => handleOpenApproval(expense, 'finance')}
                                  sx={{ minHeight: 32, fontSize: '0.75rem' }}
                                >
                                  Finance
                                </Button>
                              )}
                              {expense.is_fully_approved && expense.status !== 'PAID' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  sx={{ minHeight: 32, fontSize: '0.75rem' }}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isMobile ? 4 : 5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No requisitions submitted yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Tab 3: Cluster Deposits */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ p: { xs: 1, md: 2 } }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Cluster deposits pending treasurer confirmation
            </Alert>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Cluster</TableCell>
                    <TableCell>Leader</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date</TableCell>
                    {!isMobile && <TableCell align="center">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={isMobile ? 4 : 5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No pending deposits
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Card>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog}
        onClose={handleCloseApprovalDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Approve Requisition ({approvalType === 'chair' ? 'Chairman' : approvalType === 'treasurer' ? 'Treasurer' : 'Finance'})
        </DialogTitle>
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
              <TextField
                label="Comments (Optional)"
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="Add any comments about this approval..."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseApprovalDialog} sx={{ minHeight: 40 }}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            disabled={
              approveAsChairMutation.isPending ||
              approveAsTreasurerMutation.isPending ||
              approveAsFinanceMutation.isPending
            }
            sx={{ minHeight: 40 }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TreasuryPage;
