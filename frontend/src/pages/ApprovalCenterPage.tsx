import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Stack,
  Alert,
  Drawer,
  Divider,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Cancel,
  Pending,
  Gavel,
  AccountBalance,
  Assessment,
  Receipt,
  Group,
  MonetizationOn,
  HourglassEmpty,
  DoneAll,
  OpenInNew,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { eventService } from '../services/event.service';
import type { BudgetItem, ExpensePhase6, ClusterDeposit } from '../types';

// ---------------------------------------------------------------------------
// Unified approval item type
// ---------------------------------------------------------------------------
type ApprovalType = 'budget' | 'requisition' | 'payment' | 'cluster_submission' | 'treasury';

interface UnifiedApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  amount: number;
  statusKey: string;
  statusLabel: string;
  requestedBy: string;
  submittedOn: string;
  description?: string;
  committee?: string;
  originalData: BudgetItem | ExpensePhase6 | ClusterDeposit;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function statusChipColor(
  statusKey: string
): 'default' | 'warning' | 'success' | 'error' | 'info' | 'primary' {
  if (['APPROVED', 'FULLY_APPROVED', 'confirmed'].includes(statusKey)) return 'success';
  if (['REJECTED', 'declined'].includes(statusKey)) return 'error';
  if (['FULLY_APPROVED', 'APPROVED_FINANCE'].includes(statusKey)) return 'primary';
  if (['APPROVED_CHAIR', 'APPROVED_TREASURER'].includes(statusKey)) return 'info';
  return 'warning';
}

function typeIcon(type: ApprovalType) {
  switch (type) {
    case 'budget':
      return <Assessment fontSize="small" />;
    case 'requisition':
      return <Receipt fontSize="small" />;
    case 'payment':
      return <MonetizationOn fontSize="small" />;
    case 'cluster_submission':
      return <Group fontSize="small" />;
    case 'treasury':
      return <AccountBalance fontSize="small" />;
  }
}

function typeLabel(type: ApprovalType) {
  switch (type) {
    case 'budget':         return 'Budget Item';
    case 'requisition':    return 'Requisition';
    case 'payment':        return 'Payment';
    case 'cluster_submission': return 'Cluster Submission';
    case 'treasury':       return 'Treasury';
  }
}

function formatKSH(value: string | number | undefined): string {
  const n = parseFloat(String(value || '0'));
  return `KSH ${n.toLocaleString()}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Approval Chain Stepper (for ExpensePhase6)
// ---------------------------------------------------------------------------
function ExpenseApprovalChain({ expense }: { expense: ExpensePhase6 }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const steps = [
    { label: 'Chairman',        icon: <Gavel fontSize="small" />,          approver: expense.chair_name,    done: !!expense.approved_by_chair },
    { label: 'Treasurer',       icon: <AccountBalance fontSize="small" />,  approver: expense.treasurer_name, done: !!expense.approved_by_treasurer },
    { label: 'Finance Member',  icon: <Group fontSize="small" />,           approver: expense.finance_name,  done: !!expense.approved_by_finance },
  ];

  const activeStep = steps.findIndex((s) => !s.done);
  const isRejected = expense.status === 'REJECTED';

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        Approval Chain
      </Typography>
      <Stepper
        activeStep={isRejected ? -1 : activeStep === -1 ? 3 : activeStep}
        orientation={isMobile ? 'vertical' : 'horizontal'}
        sx={{ mb: 1 }}
      >
        {steps.map((step, idx) => (
          <Step key={step.label} completed={step.done && !isRejected}>
            <StepLabel
              error={isRejected && !step.done && idx === activeStep}
              optional={
                step.approver ? (
                  <Typography variant="caption" color="text.secondary">
                    {step.approver}
                  </Typography>
                ) : null
              }
            >
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {step.icon}
                <span>{step.label}</span>
              </Stack>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      {expense.rejection_reason && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Rejection reason: {expense.rejection_reason}
        </Alert>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Approval Item Card
// ---------------------------------------------------------------------------
function ApprovalCard({
  item,
  onViewDetails,
}: {
  item: UnifiedApprovalItem;
  onViewDetails: (item: UnifiedApprovalItem) => void;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Type + Status row */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {typeIcon(item.type)}
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {typeLabel(item.type)}
            </Typography>
          </Stack>
          <Chip
            size="small"
            label={item.statusLabel}
            color={statusChipColor(item.statusKey)}
          />
        </Stack>

        {/* Title */}
        <Typography
          variant="subtitle2"
          fontWeight={700}
          gutterBottom
          title={item.title}
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.title}
        </Typography>

        {/* Amount */}
        <Typography variant="h6" color="primary.main" sx={{ mb: 1 }}>
          {formatKSH(item.amount)}
        </Typography>

        {/* Meta */}
        <Stack spacing={0.25}>
          {item.requestedBy && (
            <Typography variant="caption" color="text.secondary">
              By: {item.requestedBy}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            On: {formatDate(item.submittedOn)}
          </Typography>
          {item.committee && (
            <Typography variant="caption" color="text.secondary">
              Committee: {item.committee}
            </Typography>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          fullWidth
          endIcon={<OpenInNew fontSize="small" />}
          onClick={() => onViewDetails(item)}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <DoneAll sx={{ fontSize: 48, color: 'success.light', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Card grid wrapper
// ---------------------------------------------------------------------------
function CardGrid({
  items,
  onViewDetails,
}: {
  items: UnifiedApprovalItem[];
  onViewDetails: (item: UnifiedApprovalItem) => void;
}) {
  if (!items.length) return <EmptyState message="No items in this category" />;
  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} md={4} key={`${item.type}-${item.id}`}>
          <ApprovalCard item={item} onViewDetails={onViewDetails} />
        </Grid>
      ))}
    </Grid>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const ApprovalCenterPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [drawerItem, setDrawerItem] = useState<UnifiedApprovalItem | null>(null);

  // ---- Queries ----
  const { data: rawBudgetItems = [] } = useQuery({
    queryKey: ['budget-items', eventId, 'PENDING'],
    queryFn: () => eventService.getEventBudgetItems(eventId!, 'PENDING'),
    enabled: !!eventId,
    refetchInterval: 15000,
  });

  const { data: rawExpenses = [] } = useQuery({
    queryKey: ['expenses', eventId],
    queryFn: () => eventService.getEventExpenses(eventId!),
    enabled: !!eventId,
    refetchInterval: 15000,
  });

  const { data: rawDeposits = [] } = useQuery({
    queryKey: ['cluster-deposits', eventId],
    queryFn: () => eventService.getClusterDeposits(eventId!),
    enabled: !!eventId,
    refetchInterval: 15000,
  });

  // ---- Normalize raw arrays ----
  const budgetItems = (Array.isArray(rawBudgetItems)
    ? rawBudgetItems
    : (rawBudgetItems as any)?.results ?? []) as BudgetItem[];

  const expenses = (Array.isArray(rawExpenses)
    ? rawExpenses
    : (rawExpenses as any)?.results ?? []) as ExpensePhase6[];

  const deposits = (Array.isArray(rawDeposits)
    ? rawDeposits
    : (rawDeposits as any)?.results ?? []) as ClusterDeposit[];

  // ---- Derived lists ----
  const requisitions = useMemo(
    () =>
      expenses.filter(
        (e) => !['REJECTED', 'PAID', 'FULLY_APPROVED'].includes(e.status)
      ),
    [expenses]
  );

  const payments = useMemo(
    () => expenses.filter((e) => e.status === 'FULLY_APPROVED'),
    [expenses]
  );

  const clusterSubmissions = useMemo(
    () => deposits.filter((d) => !d.confirmed_by_treasurer),
    [deposits]
  );

  const treasuryConfirmations = useMemo(
    () => deposits.filter((d) => d.confirmed_by_treasurer),
    [deposits]
  );

  // ---- Unified item converters ----
  const budgetToUnified = (item: BudgetItem): UnifiedApprovalItem => ({
    id: String(item.id),
    type: 'budget',
    title: item.item_name,
    amount: parseFloat(item.allocated_amount || '0'),
    statusKey: item.status,
    statusLabel: item.status === 'PENDING' ? 'Pending Approval' : item.status,
    requestedBy: item.created_by_name ?? '—',
    submittedOn: item.created_at,
    description: item.description,
    committee: item.committee_name,
    originalData: item,
  });

  const expenseToUnified = (
    expense: ExpensePhase6,
    type: 'requisition' | 'payment'
  ): UnifiedApprovalItem => ({
    id: expense.id,
    type,
    title: expense.budget_item_name || expense.description || 'Expense',
    amount: parseFloat(expense.amount || '0'),
    statusKey: expense.status,
    statusLabel: expense.status_display || expense.status,
    requestedBy: expense.chair_name ?? '—',
    submittedOn: expense.created_at,
    description: expense.description,
    originalData: expense,
  });

  const depositToUnified = (
    deposit: ClusterDeposit,
    type: 'cluster_submission' | 'treasury'
  ): UnifiedApprovalItem => ({
    id: deposit.id,
    type,
    title: `${deposit.cluster_name ?? 'Cluster'} — Deposit`,
    amount: parseFloat(deposit.amount || '0'),
    statusKey: deposit.confirmed_by_treasurer ? 'confirmed' : 'PENDING',
    statusLabel: deposit.confirmed_by_treasurer ? 'Confirmed' : 'Awaiting Confirmation',
    requestedBy: '—',
    submittedOn: deposit.created_at,
    description: deposit.notes,
    originalData: deposit,
  });

  // ---- Unified "All" list ----
  const allItems: UnifiedApprovalItem[] = useMemo(() => {
    const list: UnifiedApprovalItem[] = [
      ...budgetItems.map(budgetToUnified),
      ...requisitions.map((e) => expenseToUnified(e, 'requisition')),
      ...payments.map((e) => expenseToUnified(e, 'payment')),
      ...clusterSubmissions.map((d) => depositToUnified(d, 'cluster_submission')),
    ];
    return list.sort(
      (a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime()
    );
  }, [budgetItems, requisitions, payments, clusterSubmissions]);

  const filteredAllItems = useMemo(() => {
    return allItems.filter((item) => {
      if (filterType !== 'ALL' && item.type !== filterType) return false;
      if (filterStatus === 'PENDING' && !['PENDING', 'APPROVED_CHAIR', 'APPROVED_TREASURER'].includes(item.statusKey)) return false;
      if (filterStatus === 'APPROVED' && !['APPROVED', 'FULLY_APPROVED', 'confirmed'].includes(item.statusKey)) return false;
      if (filterStatus === 'DECLINED' && item.statusKey !== 'REJECTED') return false;
      return true;
    });
  }, [allItems, filterStatus, filterType]);

  // ---- Pending count ----
  const pendingCount =
    budgetItems.length + requisitions.length + clusterSubmissions.length;

  // ---- Mutations ----
  const budgetInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['budget-items', eventId] });
    queryClient.invalidateQueries({ queryKey: ['financial-summary', eventId] });
  };
  const expenseInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
    queryClient.invalidateQueries({ queryKey: ['financial-summary', eventId] });
  };
  const depositInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['cluster-deposits', eventId] });
    queryClient.invalidateQueries({ queryKey: ['financial-summary', eventId] });
  };

  const approveBudgetMutation = useMutation({
    mutationFn: (id: string) => eventService.approveBudgetItem(id),
    onSuccess: () => { budgetInvalidate(); setDrawerItem(null); },
  });

  const rejectBudgetMutation = useMutation({
    mutationFn: (id: string) => eventService.rejectBudgetItem(id),
    onSuccess: () => { budgetInvalidate(); setDrawerItem(null); },
  });

  const approveChairMutation = useMutation({
    mutationFn: (id: string) => eventService.approveAsChair(id),
    onSuccess: () => { expenseInvalidate(); setDrawerItem(null); },
  });

  const approveTreasurerMutation = useMutation({
    mutationFn: (id: string) => eventService.approveAsTreasurer(id),
    onSuccess: () => { expenseInvalidate(); setDrawerItem(null); },
  });

  const approveFinanceMutation = useMutation({
    mutationFn: (id: string) => eventService.approveAsFinance(id),
    onSuccess: () => { expenseInvalidate(); setDrawerItem(null); },
  });

  const confirmDepositMutation = useMutation({
    mutationFn: (id: string) => eventService.confirmClusterDeposit(id),
    onSuccess: () => { depositInvalidate(); setDrawerItem(null); },
  });

  // ---- Drawer actions ----
  const renderDrawerActions = (item: UnifiedApprovalItem) => {
    if (item.type === 'budget') {
      return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => approveBudgetMutation.mutate(item.id)}
            disabled={approveBudgetMutation.isPending}
            fullWidth={isMobile}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => rejectBudgetMutation.mutate(item.id)}
            disabled={rejectBudgetMutation.isPending}
            fullWidth={isMobile}
          >
            Reject
          </Button>
        </Stack>
      );
    }

    if (item.type === 'requisition') {
      const expense = item.originalData as ExpensePhase6;
      const needsChair = !expense.approved_by_chair;
      const needsTreasurer = !!expense.approved_by_chair && !expense.approved_by_treasurer;
      const needsFinance = !!expense.approved_by_treasurer && !expense.approved_by_finance;
      return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
          <Tooltip title={needsChair ? 'Approve as Chairman' : 'Already approved by Chairman'}>
            <span>
              <Button
                variant={needsChair ? 'contained' : 'outlined'}
                color="primary"
                startIcon={<Gavel />}
                onClick={() => approveChairMutation.mutate(item.id)}
                disabled={!needsChair || approveChairMutation.isPending}
                size="small"
                fullWidth={isMobile}
              >
                Chair
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={needsTreasurer ? 'Approve as Treasurer' : 'Waiting for chain'}>
            <span>
              <Button
                variant={needsTreasurer ? 'contained' : 'outlined'}
                color="secondary"
                startIcon={<AccountBalance />}
                onClick={() => approveTreasurerMutation.mutate(item.id)}
                disabled={!needsTreasurer || approveTreasurerMutation.isPending}
                size="small"
                fullWidth={isMobile}
              >
                Treasurer
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={needsFinance ? 'Approve as Finance Member' : 'Waiting for chain'}>
            <span>
              <Button
                variant={needsFinance ? 'contained' : 'outlined'}
                color="info"
                startIcon={<Group />}
                onClick={() => approveFinanceMutation.mutate(item.id)}
                disabled={!needsFinance || approveFinanceMutation.isPending}
                size="small"
                fullWidth={isMobile}
              >
                Finance
              </Button>
            </span>
          </Tooltip>
        </Stack>
      );
    }

    if (item.type === 'payment') {
      return (
        <Button
          variant="contained"
          startIcon={<OpenInNew />}
          onClick={() => navigate(`/events/${eventId}/treasury`)}
          fullWidth={isMobile}
        >
          Open Treasury to Execute
        </Button>
      );
    }

    if (item.type === 'cluster_submission') {
      return (
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircle />}
          onClick={() => confirmDepositMutation.mutate(item.id)}
          disabled={confirmDepositMutation.isPending}
          fullWidth={isMobile}
        >
          Confirm Receipt
        </Button>
      );
    }

    return null;
  };

  // ---- Detail Drawer ----
  const renderDrawer = () => {
    if (!drawerItem) return null;
    const expense =
      drawerItem.type === 'requisition' || drawerItem.type === 'payment'
        ? (drawerItem.originalData as ExpensePhase6)
        : null;
    const deposit =
      drawerItem.type === 'cluster_submission' || drawerItem.type === 'treasury'
        ? (drawerItem.originalData as ClusterDeposit)
        : null;

    return (
      <Drawer
        anchor="right"
        open={!!drawerItem}
        onClose={() => setDrawerItem(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 0 } }}
      >
        {/* Drawer header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {typeIcon(drawerItem.type)}
            <Typography variant="h6" fontWeight={700}>
              {typeLabel(drawerItem.type)} Details
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => setDrawerItem(null)}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
          {/* Status chip */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Chip
              label={drawerItem.statusLabel}
              color={statusChipColor(drawerItem.statusKey)}
              icon={
                drawerItem.statusKey === 'PENDING'
                  ? <HourglassEmpty fontSize="small" />
                  : drawerItem.statusKey === 'REJECTED'
                  ? <Cancel fontSize="small" />
                  : <CheckCircle fontSize="small" />
              }
            />
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {formatKSH(drawerItem.amount)}
            </Typography>
          </Stack>

          {/* Title & description */}
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {drawerItem.title}
          </Typography>
          {drawerItem.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {drawerItem.description}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Detail rows */}
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Category
                </Typography>
              </Grid>
              <Grid item xs={12} sm={7}>
                <Typography variant="body2">{typeLabel(drawerItem.type)}</Typography>
              </Grid>

              {drawerItem.requestedBy !== '—' && (
                <>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Requested By
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <Typography variant="body2">{drawerItem.requestedBy}</Typography>
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Submitted On
                </Typography>
              </Grid>
              <Grid item xs={12} sm={7}>
                <Typography variant="body2">{formatDate(drawerItem.submittedOn)}</Typography>
              </Grid>

              {drawerItem.committee && (
                <>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Committee
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <Typography variant="body2">{drawerItem.committee}</Typography>
                  </Grid>
                </>
              )}

              {deposit && (
                <>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Channel
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <Typography variant="body2">
                      {deposit.deposit_channel_display || deposit.deposit_channel || '—'}
                    </Typography>
                  </Grid>
                  {deposit.reference_number && (
                    <>
                      <Grid item xs={12} sm={5}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Reference
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={7}>
                        <Typography variant="body2">{deposit.reference_number}</Typography>
                      </Grid>
                    </>
                  )}
                </>
              )}

              {expense && (
                <>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Budget Item
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <Typography variant="body2">{expense.budget_item_name || '—'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Approvals
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <Typography variant="body2">{expense.approval_progress || '—'}</Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Stack>

          {/* Approval chain */}
          {expense && (
            <>
              <Divider sx={{ my: 2 }} />
              <ExpenseApprovalChain expense={expense} />
            </>
          )}
        </Box>

        {/* Drawer footer actions */}
        {renderDrawerActions(drawerItem) && (
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            {renderDrawerActions(drawerItem)}
          </Box>
        )}
      </Drawer>
    );
  };

  // ---- Role display ----
  const roleLabel = user?.role
    ? { ADMIN: 'Admin', LEADER: 'Chair', FINANCE: 'Finance Member', MEMBER: 'Member', STAKEHOLDER: 'Stakeholder' }[user.role] ?? user.role
    : '';

  // ---- Tab content ----
  const tabs = [
    { label: 'All',                  count: pendingCount },
    { label: 'Budget Items',         count: budgetItems.length },
    { label: 'Requisitions',         count: requisitions.length },
    { label: 'Payments',             count: payments.length },
    { label: 'Cluster Submissions',  count: clusterSubmissions.length },
    { label: 'Treasury',             count: treasuryConfirmations.length },
  ];

  const renderTabContent = () => {
    const openDrawer = (item: UnifiedApprovalItem) => setDrawerItem(item);

    switch (currentTab) {
      case 0: // All
        return (
          <Box>
            {/* Filters */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <FormControl size="small" fullWidth sx={{ minWidth: { sm: 160 } }}>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="DECLINED">Declined</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth sx={{ minWidth: { sm: 180 } }}>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="ALL">All Types</MenuItem>
                  <MenuItem value="budget">Budget Items</MenuItem>
                  <MenuItem value="requisition">Requisitions</MenuItem>
                  <MenuItem value="payment">Payments</MenuItem>
                  <MenuItem value="cluster_submission">Cluster Submissions</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            {filteredAllItems.length === 0 ? (
              <EmptyState message="No items match the current filters" />
            ) : (
              <CardGrid items={filteredAllItems} onViewDetails={openDrawer} />
            )}
          </Box>
        );

      case 1: // Budget Items
        return (
          <Box>
            {budgetItems.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Approved budget items immediately become available for requisitions.
              </Alert>
            )}
            <CardGrid
              items={budgetItems.map(budgetToUnified)}
              onViewDetails={openDrawer}
            />
          </Box>
        );

      case 2: // Requisitions
        return (
          <CardGrid
            items={requisitions.map((e) => expenseToUnified(e, 'requisition'))}
            onViewDetails={openDrawer}
          />
        );

      case 3: // Payments
        return (
          <Box>
            {payments.length > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                These are fully approved. Open the Treasury module to execute payment.
              </Alert>
            )}
            <CardGrid
              items={payments.map((e) => expenseToUnified(e, 'payment'))}
              onViewDetails={openDrawer}
            />
          </Box>
        );

      case 4: // Cluster Submissions
        return (
          <Box>
            {clusterSubmissions.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                These cluster deposits are awaiting Treasurer confirmation.
              </Alert>
            )}
            <CardGrid
              items={clusterSubmissions.map((d) => depositToUnified(d, 'cluster_submission'))}
              onViewDetails={openDrawer}
            />
          </Box>
        );

      case 5: // Treasury Confirmations
        return (
          <Box>
            {treasuryConfirmations.length > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                These deposits have been confirmed and recorded.
              </Alert>
            )}
            <CardGrid
              items={treasuryConfirmations.map((d) => depositToUnified(d, 'treasury'))}
              onViewDetails={openDrawer}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* ---- Header ---- */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h4" fontWeight={700}>
              Approval Center
            </Typography>
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} Pending`}
                color="warning"
                size="small"
                icon={<Pending fontSize="small" />}
              />
            )}
          </Stack>
          {roleLabel && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Your role: <strong>{roleLabel}</strong>
            </Typography>
          )}
        </Box>
      </Stack>

      {/* ---- Summary Cards ---- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Pending Approvals',   value: pendingCount,                          color: 'warning.main',  icon: <HourglassEmpty /> },
          { label: 'Budget Items',         value: budgetItems.length,                    color: 'primary.main',  icon: <Assessment /> },
          { label: 'Requisitions',         value: requisitions.length,                   color: 'info.main',     icon: <Receipt /> },
          { label: 'Cluster Submissions', value: clusterSubmissions.length,             color: 'secondary.main', icon: <Group /> },
        ].map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {card.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {card.value}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---- Tabs ---- */}
      <Paper sx={{ mb: 0, borderRadius: '8px 8px 0 0' }}>
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, idx) => (
            <Tab
              key={tab.label}
              label={
                isMobile ? (
                  tab.label
                ) : (
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <Chip
                        label={tab.count}
                        size="small"
                        color={idx === 0 ? 'warning' : 'default'}
                        sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' } }}
                      />
                    )}
                  </Stack>
                )
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* ---- Tab Content ---- */}
      <Paper sx={{ p: 3, borderRadius: '0 0 8px 8px', minHeight: 240 }}>
        {renderTabContent()}
      </Paper>

      {/* ---- Detail Drawer ---- */}
      {renderDrawer()}
    </Box>
  );
};

export default ApprovalCenterPage;
