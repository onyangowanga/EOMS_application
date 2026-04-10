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
  Chip,
  Button,
  Stack,
  Alert,
  AlertTitle,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  RequestPage as RequestIcon,
  AccountBalance as DepositIcon,
  CheckCircle as ApproveIcon,
  AttachMoney as MoneyIcon,
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  AutoFixHigh as AutoParseIcon,
  Upload as UploadIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { eventService } from '../services/event.service';
import type { ExpensePhase6 } from '../types';
import { parseMpesaMessage, parseMpesaStatementCsv } from '../utils/mpesa';

interface ParsedPaymentEntry {
  payer_name: string;
  payer_phone?: string;
  amount: number;
  reference_number?: string;
  recorded_at?: string;
  transaction_date_text?: string;
  description?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const TreasuryPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Main tabs: 0=Overview, 1=Incoming Funds, 2=Payments, 3=Cluster Deposits
  const [mainTab, setMainTab] = useState(0);
  const [fundsSubTab, setFundsSubTab] = useState(0);      // 0=All, 1=Cluster, 2=General
  const [paymentsSubTab, setPaymentsSubTab] = useState(0); // 0=Pending, 1=Approved, 2=Paid, 3=Rejected
  const [depositsSubTab, setDepositsSubTab] = useState(0); // 0=Pending, 1=Confirmed

  // Approval dialog
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpensePhase6 | null>(null);
  const [approvalType, setApprovalType] = useState<'chair' | 'treasurer' | 'finance' | ''>('');
  const [approvalComments, setApprovalComments] = useState('');

  // Mark Paid dialog
  const [payDialog, setPayDialog] = useState(false);
  const [payingExpense, setPayingExpense] = useState<ExpensePhase6 | null>(null);
  const [payMethod, setPayMethod] = useState('MPESA');
  const [payReference, setPayReference] = useState('');

  // Record general collection dialog
  const [collectionDialog, setCollectionDialog] = useState(false);
  const [mpesaRawMessage, setMpesaRawMessage] = useState('');
  const [batchRawMessages, setBatchRawMessages] = useState('');
  const [batchParsedEntries, setBatchParsedEntries] = useState<ParsedPaymentEntry[]>([]);
  const [importNotice, setImportNotice] = useState<{ severity: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(null);
  const [collectionForm, setCollectionForm] = useState({
    payer_name: '',
    payer_phone: '',
    amount: '',
    channel: 'CASH',
    reference_number: '',
    description: '',
  });

  // â”€â”€â”€ Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  const { data: mainCommittee } = useQuery({
    queryKey: ['main-committee', eventId],
    queryFn: () => eventService.getMainCommittee(eventId!),
    enabled: !!eventId,
  });

  const { data: deposits, isLoading: loadingDeposits } = useQuery({
    queryKey: ['cluster-deposits', eventId],
    queryFn: () => eventService.getClusterDeposits(eventId!),
    enabled: !!eventId,
  });

  const { data: clusters, isLoading: loadingClusters } = useQuery({
    queryKey: ['clusters', eventId, 'treasury'],
    queryFn: () => eventService.getEventClusters(eventId!),
    enabled: !!eventId,
  });

  // â”€â”€â”€ Normalized data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const normalizedCollections: any[] = Array.isArray(collections)
    ? collections : ((collections as any)?.results || []);
  const normalizedExpenses: ExpensePhase6[] = Array.isArray(expenses)
    ? expenses : ((expenses as any)?.results || []);
  const normalizedDeposits: any[] = Array.isArray(deposits)
    ? deposits : ((deposits as any)?.results || []);
  const normalizedClusters: any[] = Array.isArray(clusters)
    ? clusters : ((clusters as any)?.results || []);

  const parseAmount = (value: unknown): number => {
    const num = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
    return Number.isFinite(num) ? num : 0;
  };

  const toDayKey = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  };

  const collectionDedupKeys = new Set(
    normalizedCollections
      .filter((c) => c.source_type === 'CLUSTER')
      .map((c) => `${parseAmount(c.amount)}|${c.reference_number || ''}|${toDayKey(c.created_at || c.received_at)}|${c.cluster_name || ''}`)
  );

  const clusterReceiptsFromDeposits = normalizedDeposits.map((dep) => ({
    id: `dep-${dep.id}`,
    source_type: 'CLUSTER',
    source_type_display: 'Cluster Deposit',
    amount: dep.amount,
    created_at: dep.created_at,
    payer_name: dep.cluster_name || 'Cluster',
    payer_phone: '',
    channel: dep.deposit_channel,
    reference_number: dep.reference_number,
    cluster_name: dep.cluster_name,
    confirmation_status: dep.confirmed_by_treasurer ? 'CONFIRMED' : 'PENDING',
  })).filter((dep) => {
    const key = `${parseAmount(dep.amount)}|${dep.reference_number || ''}|${toDayKey(dep.created_at)}|${dep.cluster_name || ''}`;
    return !collectionDedupKeys.has(key);
  });

  const allIncomingFunds = [...normalizedCollections, ...clusterReceiptsFromDeposits]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  // Filtered slices
  const clusterCollections = allIncomingFunds.filter(c => c.source_type === 'CLUSTER');
  const generalCollections = allIncomingFunds.filter(c => c.source_type !== 'CLUSTER');
  const pendingExpenses = normalizedExpenses.filter(e =>
    ['PENDING', 'APPROVED_CHAIR', 'APPROVED_TREASURER'].includes(e.status));
  const approvedExpenses = normalizedExpenses.filter(e => e.status === 'FULLY_APPROVED');
  const paidExpenses = normalizedExpenses.filter(e => e.status === 'PAID');
  const rejectedExpenses = normalizedExpenses.filter(e => e.status === 'REJECTED');
  const pendingDeposits = normalizedDeposits.filter(d => !d.confirmed_by_treasurer);
  const confirmedDeposits = normalizedDeposits.filter(d => d.confirmed_by_treasurer);

  const totalCollectedAmount = allIncomingFunds.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  const clusterCollectedAmount = clusterCollections.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  const generalCollectedAmount = generalCollections.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  const totalSpentAmount = parseAmount(financialSummary?.expenses?.total);
  const treasuryBalance = totalCollectedAmount - totalSpentAmount;
  const totalUnsubmittedFunds = normalizedClusters.reduce(
    (sum, cluster) => sum + parseAmount(cluster.pending_in_lead_account || cluster.funds_in_lead_account),
    0
  );
  const pendingExpenseAmount = parseAmount(financialSummary?.expenses?.pending);
  const budgetUtilization = parseAmount(financialSummary?.budget_utilization);
  const hasHighPendingBudget = totalSpentAmount > 0 && (pendingExpenseAmount / totalSpentAmount) > 0.3;
  const hasBudgetOverrun = budgetUtilization > 100;
  const isUnderfunded = totalCollectedAmount < totalSpentAmount;

  // â”€â”€â”€ Mutations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  const markPaidMutation = useMutation({
    mutationFn: (data: { id: string; method: string; reference: string }) =>
      eventService.markExpensePaid(data.id, data.method, data.reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      setPayDialog(false);
      setPayingExpense(null);
      setPayMethod('MPESA');
      setPayReference('');
    },
  });

  const confirmDepositMutation = useMutation({
    mutationFn: (depositId: string) => eventService.confirmClusterDeposit(depositId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  const createGeneralCollectionMutation = useMutation({
    mutationFn: (data: Parameters<typeof eventService.createGeneralCollection>[0]) =>
      eventService.createGeneralCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      setCollectionDialog(false);
      setMpesaRawMessage('');
      setBatchRawMessages('');
      setBatchParsedEntries([]);
      setImportNotice(null);
      setCollectionForm({
        payer_name: '',
        payer_phone: '',
        amount: '',
        channel: 'CASH',
        reference_number: '',
        description: '',
      });
    },
  });

  // â”€â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      case 'chair': approveAsChairMutation.mutate(data); break;
      case 'treasurer': approveAsTreasurerMutation.mutate(data); break;
      case 'finance': approveAsFinanceMutation.mutate(data); break;
    }
  };

  const handleSaveGeneralCollection = () => {
    if (!eventId || !mainCommittee || !collectionForm.payer_name || !collectionForm.amount) return;

    createGeneralCollectionMutation.mutate({
      event: eventId,
      committee_id: Number((mainCommittee as any).id),
      payer_name: collectionForm.payer_name,
      payer_phone: collectionForm.payer_phone || undefined,
      amount: parseFloat(collectionForm.amount),
      channel: collectionForm.channel as 'CASH' | 'MPESA' | 'BANK' | 'OTHER',
      reference_number: collectionForm.reference_number || undefined,
      description: collectionForm.description || undefined,
    });
  };

  const handleParseMpesaMessage = () => {
    const parsed = parseMpesaMessage(mpesaRawMessage);
    if (!parsed) {
      return;
    }

    setCollectionForm((current) => ({
      ...current,
      payer_name: parsed.contributorName || current.payer_name,
      payer_phone: parsed.contributorPhone || current.payer_phone,
      amount: parsed.amount != null ? String(parsed.amount) : current.amount,
      channel: 'MPESA',
      reference_number: parsed.transactionReference || current.reference_number,
    }));
    setImportNotice(null);
  };

  const handleParseBatchMessages = () => {
    const lines = batchRawMessages
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const parsedEntries = lines
      .map((line) => parseMpesaMessage(line))
      .filter((parsed): parsed is NonNullable<typeof parsed> => !!parsed && !!parsed.contributorName && typeof parsed.amount === 'number')
      .map((parsed) => ({
        payer_name: parsed.contributorName!,
        payer_phone: parsed.contributorPhone,
        amount: parsed.amount!,
        reference_number: parsed.transactionReference,
        transaction_date_text: parsed.transactionDateText,
        description: parsed.transactionDateText
          ? `Imported from M-Pesa message. Original transaction date: ${parsed.transactionDateText}`
          : 'Imported from M-Pesa message.',
      }));

    setBatchParsedEntries(parsedEntries);
    setImportNotice(
      parsedEntries.length > 0
        ? { severity: 'success', message: `${parsedEntries.length} M-Pesa messages parsed and ready for import.` }
        : { severity: 'warning', message: 'No valid M-Pesa messages were parsed.' }
    );
  };

  const handleImportStatementFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const csvText = await file.text();
      const { entries, skippedRows, totalRows } = parseMpesaStatementCsv(csvText);

      if (entries.length === 0) {
        setBatchParsedEntries([]);
        setImportNotice({
          severity: 'warning',
          message: 'No valid incoming receipts were found in the selected CSV statement.',
        });
        return;
      }

      const existingReferences = new Set(
        normalizedCollections
          .map((collection) => String((collection as any).reference_number || '').trim().toUpperCase())
          .filter(Boolean)
      );

      const seenReferences = new Set<string>();
      let skippedExisting = 0;
      let skippedDuplicatesInFile = 0;

      const parsedEntries: ParsedPaymentEntry[] = [];
      for (const entry of entries) {
        const reference = String(entry.transactionReference || '').trim().toUpperCase();

        if (reference && existingReferences.has(reference)) {
          skippedExisting += 1;
          continue;
        }

        if (reference && seenReferences.has(reference)) {
          skippedDuplicatesInFile += 1;
          continue;
        }

        if (reference) seenReferences.add(reference);

        parsedEntries.push({
          payer_name: entry.contributorName || 'Unknown Payer',
          payer_phone: entry.contributorPhone,
          amount: entry.amount || 0,
          reference_number: reference || undefined,
          recorded_at: entry.transactionDateIso,
          transaction_date_text: entry.transactionDateText,
          description: [
            'Imported from M-Pesa statement CSV.',
            entry.transactionDateText ? `Original transaction date: ${entry.transactionDateText}.` : '',
            entry.details ? `Statement details: ${entry.details}` : '',
          ].filter(Boolean).join(' '),
        });
      }

      setBatchParsedEntries(parsedEntries);
      setBatchRawMessages('');
      setImportNotice({
        severity: 'success',
        message: [
          `${parsedEntries.length} receipts ready for import from ${file.name}.`,
          skippedRows > 0 ? `${skippedRows} non-receipt rows ignored.` : '',
          skippedExisting > 0 ? `${skippedExisting} existing references skipped.` : '',
          skippedDuplicatesInFile > 0 ? `${skippedDuplicatesInFile} duplicate references in the file skipped.` : '',
          totalRows > 0 ? `${totalRows} rows read.` : '',
        ].filter(Boolean).join(' '),
      });
    } catch (_error) {
      setBatchParsedEntries([]);
      setImportNotice({
        severity: 'error',
        message: 'The selected CSV could not be read. Use the polished or Safaricom statement export format.',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleUpdateParsedEntry = (
    index: number,
    field: keyof ParsedPaymentEntry,
    value: string | number
  ) => {
    setBatchParsedEntries((prev) =>
      prev.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [field]: field === 'amount' ? Number(value) || 0 : value,
            }
          : entry
      )
    );
  };

  const handleRemoveParsedEntry = (index: number) => {
    setBatchParsedEntries((prev) => prev.filter((_, entryIndex) => entryIndex !== index));
  };

  const handleImportBatchMessages = async () => {
    if (!eventId || !mainCommittee || batchParsedEntries.length === 0) {
      return;
    }

    const requests = batchParsedEntries.map((entry) =>
      eventService.createGeneralCollection({
        event: eventId,
        committee_id: Number((mainCommittee as any).id),
        payer_name: entry.payer_name,
        payer_phone: entry.payer_phone || undefined,
        amount: entry.amount,
        channel: 'MPESA',
        reference_number: entry.reference_number || undefined,
        description: entry.description || undefined,
        recorded_at: entry.recorded_at,
      })
    );

    await Promise.allSettled(requests);
    queryClient.invalidateQueries({ queryKey: ['collections'] });
    queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    setBatchParsedEntries([]);
    setBatchRawMessages('');
    setImportNotice({ severity: 'success', message: 'Parsed entries imported to treasury.' });
  };

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return `KSH ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string): 'default' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'PAID': return 'success';
      case 'FULLY_APPROVED': return 'success';
      case 'APPROVED_CHAIR':
      case 'APPROVED_TREASURER': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getApprovalProgress = (expense: ExpensePhase6): number => {
    if (expense.approval_progress) return parseFloat(expense.approval_progress);
    let count = 0;
    if (expense.approved_by_chair) count++;
    if (expense.approved_by_treasurer) count++;
    if (expense.approved_by_finance) count++;
    return (count / 3) * 100;
  };

  const canApproveAsChair = (e: ExpensePhase6) => !e.approved_by_chair;
  const canApproveAsTreasurer = (e: ExpensePhase6) => !!e.approved_by_chair && !e.approved_by_treasurer;
  const canApproveAsFinance = (e: ExpensePhase6) => !!e.approved_by_treasurer && !e.approved_by_finance;

  // â”€â”€â”€ Shared table components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const CollectionsTable = ({ rows }: { rows: any[] }) => (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size={isMobile ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Received From</TableCell>
            {!isMobile && <TableCell>Channel</TableCell>}
            <TableCell align="right">Amount</TableCell>
            {!isMobile && <TableCell>Reference</TableCell>}
            {!isMobile && <TableCell>Type</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? rows.map((c: any) => (
            <TableRow key={c.id} hover>
              <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">{c.payer_name || '-'}</Typography>
                {c.payer_phone && (
                  <Typography variant="caption" color="text.secondary">{c.payer_phone}</Typography>
                )}
              </TableCell>
              {!isMobile && (
                <TableCell>
                  <Chip label={c.channel || 'CASH'} size="small" variant="outlined" />
                </TableCell>
              )}
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {formatCurrency(c.amount)}
              </TableCell>
              {!isMobile && (
                <TableCell>
                  <Typography variant="caption">{c.reference_number || '-'}</Typography>
                </TableCell>
              )}
              {!isMobile && (
                <TableCell>
                  <Chip
                    label={c.source_type_display || c.source_type || 'General'}
                    size="small"
                    color={c.source_type === 'CLUSTER' ? 'primary' : 'default'}
                  />
                </TableCell>
              )}
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={isMobile ? 3 : 6} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">No records found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const ExpensesTable = ({ rows }: { rows: ExpensePhase6[] }) => (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size={isMobile ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            <TableCell>Item / Vendor</TableCell>
            {!isMobile && <TableCell>Description</TableCell>}
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? rows.map((expense) => {
            const progress = getApprovalProgress(expense);
            return (
              <TableRow key={expense.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {expense.budget_item_name || 'General'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(expense as any).vendor || ''}
                  </Typography>
                  {isMobile && expense.description && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {expense.description.substring(0, 40)}...
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
                        <Chip label="Chair OK" size="small" color="success" sx={{ fontSize: '0.7rem' }} />
                      )}
                      {expense.approved_by_treasurer && (
                        <Chip label="Treasurer OK" size="small" color="success" sx={{ fontSize: '0.7rem' }} />
                      )}
                      {expense.approved_by_finance && (
                        <Chip label="Finance OK" size="small" color="success" sx={{ fontSize: '0.7rem' }} />
                      )}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Stack direction={isMobile ? 'column' : 'row'} spacing={0.5} justifyContent="center">
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
                        startIcon={<PaymentIcon />}
                        onClick={() => {
                          setPayingExpense(expense);
                          setPayMethod('MPESA');
                          setPayReference('');
                          setPayDialog(true);
                        }}
                        sx={{ minHeight: 32, fontSize: '0.75rem' }}
                      >
                        Pay
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={isMobile ? 4 : 5} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">No records found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loadingCollections || loadingExpenses || loadingSummary || loadingDeposits || loadingClusters) {
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
          Manage incoming funds, payment approvals, and cluster deposits
        </Typography>
      </Box>

      {/* Top Summary Cards */}
      {financialSummary && (
        <>
        <Alert severity="info" sx={{ mb: 2 }}>
          Balance means <strong>all treasury-visible collected funds minus paid expenses</strong>. Total Unsubmitted Funds shows money still held by cluster leads and not yet submitted to treasury.
        </Alert>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MoneyIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Balance</Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold" color="success.main">
                    {formatCurrency(treasuryBalance)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Treasury-visible collections less paid expenses
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ReceiptIcon color="primary" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Total Collected</Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                    {formatCurrency(totalCollectedAmount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Direct receipts plus cluster deposits
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <RequestIcon color="warning" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
                  </Stack>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                    {formatCurrency(financialSummary.expenses.total)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Paid expenses already posted to treasury
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <RequestIcon color="info" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Total Unsubmitted Funds</Typography>
                  </Stack>
                  <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    fontWeight="bold"
                    color={totalUnsubmittedFunds > 0 ? 'warning.main' : 'success.main'}
                  >
                    {formatCurrency(totalUnsubmittedFunds)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Funds still with cluster leads, not yet submitted
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        </>
      )}

      {financialSummary && (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {isUnderfunded && (
            <Alert severity="warning">
              Insufficient funds risk: total funds collected are below total funds spent.
            </Alert>
          )}
          {totalUnsubmittedFunds > 0 && (
            <Alert severity="warning">
              <AlertTitle>Unsubmitted Funds Outstanding</AlertTitle>
              <strong>{formatCurrency(totalUnsubmittedFunds)}</strong> is still held by cluster leads and needs treasury follow-up.
              <Box
                component="ul"
                sx={{ mt: 1, mb: 0, pl: 2, '& li': { mb: 0.5 } }}
              >
                {normalizedClusters
                  .filter((c) => parseAmount(c.pending_in_lead_account || c.funds_in_lead_account) > 0)
                  .sort((a, b) =>
                    parseAmount(b.pending_in_lead_account || b.funds_in_lead_account) -
                    parseAmount(a.pending_in_lead_account || a.funds_in_lead_account)
                  )
                  .map((c) => (
                    <li key={c.id}>
                      <strong>{c.name}</strong>
                      {c.cluster_lead_name ? ` (Lead: ${c.cluster_lead_name})` : ''}
                      {' — '}
                      <strong style={{ color: 'inherit' }}>{formatCurrency(parseAmount(c.pending_in_lead_account || c.funds_in_lead_account))}</strong>
                    </li>
                  ))}
              </Box>
            </Alert>
          )}
          {hasHighPendingBudget && (
            <Alert severity="warning">
              High pending budget risk: pending expenses exceed 30% of total spend.
            </Alert>
          )}
          {hasBudgetOverrun && (
            <Alert severity="error">
              Budget overrun risk: budget utilization has exceeded 100%.
            </Alert>
          )}
        </Stack>
      )}

      {/* Main Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={mainTab}
            onChange={(_, v) => setMainTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab
              icon={<DashboardIcon />}
              label="Overview"
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 72 : 48 }}
            />
            <Tab
              icon={<ReceiptIcon />}
              label="Incoming Funds"
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 72 : 48 }}
            />
            <Tab
              icon={<RequestIcon />}
              label="Payments"
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 72 : 48 }}
            />
            <Tab
              icon={<DepositIcon />}
              label="Cluster Deposits"
              iconPosition={isMobile ? 'top' : 'start'}
              sx={{ minHeight: isMobile ? 72 : 48 }}
            />
          </Tabs>
        </Box>

        {/* â”€â”€ Tab 0: Overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TabPanel value={mainTab} index={0}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Grid container spacing={3}>

              {/* Collections breakdown */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Collections Breakdown</Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2">Cluster Fundraising</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(clusterCollectedAmount)}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={
                            totalCollectedAmount > 0
                              ? (clusterCollectedAmount / totalCollectedAmount) * 100
                              : 0
                          }
                          color="primary"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2">General / Direct</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(generalCollectedAmount)}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={
                            totalCollectedAmount > 0
                              ? (generalCollectedAmount / totalCollectedAmount) * 100
                              : 0
                          }
                          color="secondary"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Payments overview */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Payments Overview</Typography>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Pending Requisitions</Typography>
                        <Chip label={pendingExpenses.length} size="small" color="warning" />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Fully Approved (ready to pay)</Typography>
                        <Chip label={approvedExpenses.length} size="small" color="success" />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Paid</Typography>
                        <Chip label={paidExpenses.length} size="small" />
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Pending Cluster Deposits</Typography>
                        <Chip
                          label={loadingDeposits ? '...' : pendingDeposits.length}
                          size="small"
                          color={pendingDeposits.length > 0 ? 'error' : 'default'}
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent incoming funds */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Recent Incoming Funds (latest 5)
                </Typography>
                <CollectionsTable rows={allIncomingFunds.slice(0, 5)} />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* â”€â”€ Tab 1: Incoming Funds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TabPanel value={mainTab} index={1}>
          <Box sx={{ p: 2, pb: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                Record and review incoming collections
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button component="label" variant="outlined" startIcon={<UploadIcon />} disabled={!mainCommittee}>
                  Import Statement CSV
                  <input hidden accept=".csv,text/csv" type="file" onChange={handleImportStatementFile} />
                </Button>
                <Button
                  variant="contained"
                  startIcon={<MoneyIcon />}
                  onClick={() => setCollectionDialog(true)}
                  disabled={!mainCommittee}
                >
                  Record Payment Received
                </Button>
              </Stack>
            </Stack>
            {!mainCommittee && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Main committee not found for this event. Create one first to record general collections.
              </Alert>
            )}
            {importNotice && (
              <Alert severity={importNotice.severity} sx={{ mt: 1 }}>
                {importNotice.message}
              </Alert>
            )}
          </Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs
              value={fundsSubTab}
              onChange={(_, v) => setFundsSubTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={`All (${allIncomingFunds.length})`} />
              <Tab label={`Cluster (${clusterCollections.length})`} />
              <Tab label={`General (${generalCollections.length})`} />
            </Tabs>
          </Box>
          <Box sx={{ p: { xs: 1, md: 2 } }}>
            <TabPanel value={fundsSubTab} index={0}>
              <CollectionsTable rows={allIncomingFunds} />
            </TabPanel>
            <TabPanel value={fundsSubTab} index={1}>
              <CollectionsTable rows={clusterCollections} />
            </TabPanel>
            <TabPanel value={fundsSubTab} index={2}>
              <CollectionsTable rows={generalCollections} />
            </TabPanel>
          </Box>
        </TabPanel>

        {/* â”€â”€ Tab 2: Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TabPanel value={mainTab} index={2}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs
              value={paymentsSubTab}
              onChange={(_, v) => setPaymentsSubTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={`Pending (${pendingExpenses.length})`} />
              <Tab label={`Approved (${approvedExpenses.length})`} />
              <Tab label={`Paid (${paidExpenses.length})`} />
              <Tab label={`Rejected (${rejectedExpenses.length})`} />
            </Tabs>
          </Box>
          <Box sx={{ p: { xs: 1, md: 2 } }}>
            <TabPanel value={paymentsSubTab} index={0}>
              <ExpensesTable rows={pendingExpenses} />
            </TabPanel>
            <TabPanel value={paymentsSubTab} index={1}>
              <Alert severity="info" sx={{ mb: 2 }}>
                These requisitions are fully approved. Use the <strong>Pay</strong> button to execute payment.
              </Alert>
              <ExpensesTable rows={approvedExpenses} />
            </TabPanel>
            <TabPanel value={paymentsSubTab} index={2}>
              <ExpensesTable rows={paidExpenses} />
            </TabPanel>
            <TabPanel value={paymentsSubTab} index={3}>
              <ExpensesTable rows={rejectedExpenses} />
            </TabPanel>
          </Box>
        </TabPanel>

        {/* â”€â”€ Tab 3: Cluster Deposits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <TabPanel value={mainTab} index={3}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs value={depositsSubTab} onChange={(_, v) => setDepositsSubTab(v)}>
              <Tab label={`Pending Confirmation (${loadingDeposits ? '...' : pendingDeposits.length})`} />
              <Tab label={`Confirmed (${loadingDeposits ? '...' : confirmedDeposits.length})`} />
            </Tabs>
          </Box>
          <Box sx={{ p: { xs: 1, md: 2 } }}>
            {loadingDeposits ? (
              <Skeleton variant="rectangular" height={200} />
            ) : (
              <>
                {/* Pending deposits */}
                <TabPanel value={depositsSubTab} index={0}>
                  {pendingDeposits.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {pendingDeposits.length} deposit(s) awaiting your confirmation as Treasurer.
                    </Alert>
                  )}
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size={isMobile ? 'small' : 'medium'}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Cluster</TableCell>
                          <TableCell>Submitted By</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          {!isMobile && <TableCell>Channel</TableCell>}
                          {!isMobile && <TableCell>Reference</TableCell>}
                          <TableCell>Date</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingDeposits.length > 0 ? pendingDeposits.map((dep: any) => (
                          <TableRow key={dep.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">{dep.cluster_name || '-'}</Typography>
                            </TableCell>
                            <TableCell>
                              {dep.deposited_by_details?.full_name || dep.deposited_by_details?.username || '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              {formatCurrency(dep.amount)}
                            </TableCell>
                            {!isMobile && (
                              <TableCell>
                                <Chip
                                  label={dep.deposit_channel_display || dep.deposit_channel || 'MPESA'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                            )}
                            {!isMobile && (
                              <TableCell>
                                <Typography variant="caption">{dep.reference_number || '-'}</Typography>
                              </TableCell>
                            )}
                            <TableCell>{new Date(dep.created_at).toLocaleDateString()}</TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => confirmDepositMutation.mutate(dep.id)}
                                disabled={confirmDepositMutation.isPending}
                                sx={{ minHeight: 32 }}
                              >
                                Confirm
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={isMobile ? 5 : 7} align="center" sx={{ py: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                No pending deposits
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                {/* Confirmed deposits */}
                <TabPanel value={depositsSubTab} index={1}>
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size={isMobile ? 'small' : 'medium'}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Cluster</TableCell>
                          <TableCell>Submitted By</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          {!isMobile && <TableCell>Channel</TableCell>}
                          <TableCell>Confirmed On</TableCell>
                          {!isMobile && <TableCell>Confirmed By</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {confirmedDeposits.length > 0 ? confirmedDeposits.map((dep: any) => (
                          <TableRow key={dep.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">{dep.cluster_name || '-'}</Typography>
                            </TableCell>
                            <TableCell>{dep.deposited_by_details?.full_name || '-'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              {formatCurrency(dep.amount)}
                            </TableCell>
                            {!isMobile && (
                              <TableCell>
                                <Chip
                                  label={dep.deposit_channel_display || dep.deposit_channel || 'MPESA'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              <Chip label="Confirmed" size="small" color="success" />
                              {dep.treasurer_confirmation_date && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {new Date(dep.treasurer_confirmation_date).toLocaleDateString()}
                                </Typography>
                              )}
                            </TableCell>
                            {!isMobile && (
                              <TableCell>{dep.confirmed_by_details?.full_name || '-'}</TableCell>
                            )}
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={isMobile ? 4 : 6} align="center" sx={{ py: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                No confirmed deposits yet
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>
              </>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* â”€â”€ Approval Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog
        open={approvalDialog}
        onClose={handleCloseApprovalDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Approve â€”{' '}
          {approvalType === 'chair' ? 'Chairman' : approvalType === 'treasurer' ? 'Treasurer' : 'Finance Member'}
        </DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Budget Item</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedExpense.budget_item_name || 'General'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Amount</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(selectedExpense.amount)}
                </Typography>
              </Box>
              {selectedExpense.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body2">{selectedExpense.description}</Typography>
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
                placeholder="Add approval comments..."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseApprovalDialog} sx={{ minHeight: 40 }}>Cancel</Button>
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

      {/* â”€â”€ Mark Paid Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog
        open={payDialog}
        onClose={() => setPayDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Execute Payment</DialogTitle>
        <DialogContent>
          {payingExpense && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Alert severity="info">
                You are marking{' '}
                <strong>{payingExpense.budget_item_name || 'General'}</strong>{' '}
                â€” <strong>{formatCurrency(payingExpense.amount)}</strong> as paid.
              </Alert>
              <FormControl fullWidth required>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="MPESA">M-Pesa</MenuItem>
                  <MenuItem value="BANK">Bank Transfer</MenuItem>
                  <MenuItem value="CHEQUE">Cheque</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Reference / Transaction Number"
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                fullWidth
                placeholder="e.g., MPESA transaction code, cheque number"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayDialog(false)} sx={{ minHeight: 40 }}>Cancel</Button>
          <Button
            onClick={() => markPaidMutation.mutate({
              id: payingExpense!.id,
              method: payMethod,
              reference: payReference,
            })}
            variant="contained"
            color="success"
            startIcon={<PaymentIcon />}
            disabled={markPaidMutation.isPending}
            sx={{ minHeight: 40 }}
          >
            {markPaidMutation.isPending ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* â”€â”€ Record General Collection Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog
        open={collectionDialog}
        onClose={() => setCollectionDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Record Payment Received</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Alert severity="info">
              This records a <strong>general/direct</strong> incoming payment to treasury.
            </Alert>

            <TextField
              label="Paste Single M-Pesa Message"
              value={mpesaRawMessage}
              onChange={(e) => setMpesaRawMessage(e.target.value)}
              multiline
              minRows={3}
              placeholder="Paste the full M-Pesa SMS here to auto-fill the form"
              fullWidth
            />

            <Button variant="outlined" startIcon={<AutoParseIcon />} onClick={handleParseMpesaMessage}>
              Parse M-Pesa Message
            </Button>

            <Divider />

            <TextField
              label="Paste Multiple Direct M-Pesa Messages"
              value={batchRawMessages}
              onChange={(e) => setBatchRawMessages(e.target.value)}
              multiline
              minRows={4}
              placeholder="Paste one M-Pesa message per line"
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" startIcon={<AutoParseIcon />} onClick={handleParseBatchMessages}>
                Parse Bulk Messages
              </Button>
              <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
                Load Statement CSV
                <input hidden accept=".csv,text/csv" type="file" onChange={handleImportStatementFile} />
              </Button>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={handleImportBatchMessages}
                disabled={batchParsedEntries.length === 0 || !mainCommittee}
              >
                Import Parsed ({batchParsedEntries.length})
              </Button>
            </Stack>

            {batchParsedEntries.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Transaction Date</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchParsedEntries.map((entry, index) => (
                      <TableRow key={`${entry.reference_number || 'payment'}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{entry.transaction_date_text || '-'}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={entry.payer_name}
                            onChange={(e) => handleUpdateParsedEntry(index, 'payer_name', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={entry.payer_phone || ''}
                            onChange={(e) => handleUpdateParsedEntry(index, 'payer_phone', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            value={entry.amount}
                            onChange={(e) => handleUpdateParsedEntry(index, 'amount', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={entry.reference_number || ''}
                            onChange={(e) => handleUpdateParsedEntry(index, 'reference_number', e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            color="error"
                            size="small"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => handleRemoveParsedEntry(index)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Divider />

            <TextField
              label="Payer Name"
              value={collectionForm.payer_name}
              onChange={(e) => setCollectionForm((f) => ({ ...f, payer_name: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              label="Phone Number"
              value={collectionForm.payer_phone}
              onChange={(e) => setCollectionForm((f) => ({ ...f, payer_phone: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Amount (KES)"
              type="number"
              value={collectionForm.amount}
              onChange={(e) => setCollectionForm((f) => ({ ...f, amount: e.target.value }))}
              inputProps={{ min: 0 }}
              required
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Payment Channel</InputLabel>
              <Select
                value={collectionForm.channel}
                label="Payment Channel"
                onChange={(e) => setCollectionForm((f) => ({ ...f, channel: e.target.value }))}
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="MPESA">M-Pesa</MenuItem>
                <MenuItem value="BANK">Bank Transfer</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Reference Number"
              value={collectionForm.reference_number}
              onChange={(e) => setCollectionForm((f) => ({ ...f, reference_number: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Description"
              value={collectionForm.description}
              onChange={(e) => setCollectionForm((f) => ({ ...f, description: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />

            {createGeneralCollectionMutation.isError && (
              <Alert severity="error">
                Failed to record collection. Please verify details and try again.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCollectionDialog(false)} sx={{ minHeight: 40 }}>Cancel</Button>
          <Button
            onClick={handleSaveGeneralCollection}
            variant="contained"
            startIcon={<MoneyIcon />}
            disabled={
              createGeneralCollectionMutation.isPending ||
              !mainCommittee ||
              !collectionForm.payer_name ||
              !collectionForm.amount
            }
            sx={{ minHeight: 40 }}
          >
            {createGeneralCollectionMutation.isPending ? 'Saving...' : 'Save Collection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TreasuryPage;
