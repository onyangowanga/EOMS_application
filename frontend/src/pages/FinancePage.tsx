import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AutoFixHigh as AutoParseIcon,
  Upload as UploadIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../services/finance.service';
import { committeeService } from '../services/committee.service';
import { eventService } from '../services/event.service';
import type { CollectionCreate, ExpenseCreate } from '../types/index';
import { useAuth } from '../contexts/AuthContext';
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

type CollectionFormState = Partial<CollectionCreate> & {
  source_type?: 'GENERAL' | 'CLUSTER';
  cluster?: number;
};

const FinancePage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);
  const [openCollectionDialog, setOpenCollectionDialog] = useState(false);
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [error, setError] = useState('');
  const [mpesaRawMessage, setMpesaRawMessage] = useState('');
  const [batchRawMessages, setBatchRawMessages] = useState('');
  const [batchParsedEntries, setBatchParsedEntries] = useState<ParsedPaymentEntry[]>([]);
  const [notice, setNotice] = useState<{ severity: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(null);
  
  const [collectionData, setCollectionData] = useState<CollectionFormState>({
    committee_id: undefined,
    source_type: 'GENERAL',
    cluster: undefined,
    payer_name: '',
    payer_phone: '',
    amount: 0,
    channel: 'MPESA',
    reference_number: '',
  });

  const [expenseData, setExpenseData] = useState<Partial<ExpenseCreate>>({
    committee_id: undefined,
    vendor: '',
    amount: 0,
    category: 'VENUE',
    description: '',
  });

  // Fetch data
  const { data: collections, isLoading: collectionsLoading } = useQuery<any[]>({
    queryKey: ['collections', eventId],
    queryFn: () => (eventId ? eventService.getEventCollections(eventId) : financeService.getCollections()),
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<any[]>({
    queryKey: ['expenses', eventId],
    queryFn: () => (eventId ? eventService.getEventExpenses(eventId) : financeService.getExpenses()),
  });

  const { data: committees } = useQuery({
    queryKey: ['committees'],
    queryFn: committeeService.getAll,
  });

  const { data: clusters } = useQuery<any[]>({
    queryKey: ['clusters', eventId],
    queryFn: () => (eventId ? eventService.getEventClusters(eventId) : Promise.resolve([])),
    enabled: !!eventId,
  });

  const normalizedCollections = Array.isArray(collections)
    ? collections
    : ((collections as any)?.results || []);

  const normalizedExpenses = Array.isArray(expenses)
    ? expenses
    : ((expenses as any)?.results || []);

  const summary = {
    total_collections: normalizedCollections.reduce(
      (sum: number, item: any) => sum + parseFloat(item.amount || '0'),
      0
    ),
    total_expenses: normalizedExpenses.reduce(
      (sum: number, item: any) => sum + parseFloat(item.amount || '0'),
      0
    ),
    balance: 0,
  };
  summary.balance = summary.total_collections - summary.total_expenses;

  // Mutations
  const createCollectionMutation = useMutation({
    mutationFn: financeService.createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', eventId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      setOpenCollectionDialog(false);
      resetCollectionForm();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to record collection');
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: financeService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      setOpenExpenseDialog(false);
      resetExpenseForm();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to record expense');
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: (id: number) => financeService.approveExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
    },
  });

  const resetCollectionForm = () => {
    setCollectionData({
      committee_id: undefined,
      source_type: 'GENERAL',
      cluster: undefined,
      payer_name: '',
      payer_phone: '',
      amount: 0,
      channel: 'MPESA',
      reference_number: '',
    });
    setError('');
    setNotice(null);
    setMpesaRawMessage('');
  };

  const handleParseMpesaMessage = () => {
    const parsed = parseMpesaMessage(mpesaRawMessage);
    if (!parsed) {
      setError('Could not parse M-Pesa message. Please paste a full transaction SMS.');
      return;
    }

    setCollectionData((prev) => ({
      ...prev,
      payer_name: parsed.contributorName || prev.payer_name,
      payer_phone: parsed.contributorPhone || prev.payer_phone,
      amount: parsed.amount ?? prev.amount,
      channel: 'MPESA',
      reference_number: parsed.transactionReference || prev.reference_number,
    }));
    setError('');
    setNotice(null);
  };

  const resetExpenseForm = () => {
    setExpenseData({
      committee_id: undefined,
      vendor: '',
      amount: 0,
      category: 'VENUE',
      description: '',
    });
    setError('');
    setNotice(null);
  };

  const handleCreateCollection = () => {
    if (!collectionData.committee_id || !collectionData.payer_name || !collectionData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    if ((collectionData as any).source_type === 'CLUSTER' && !(collectionData as any).cluster) {
      setError('Please select the cluster unit for cluster collections');
      return;
    }

    const payload: any = {
      ...collectionData,
      event: eventId,
      source_type: (collectionData as any).source_type || 'GENERAL',
      cluster: (collectionData as any).source_type === 'CLUSTER' ? (collectionData as any).cluster : undefined,
    };

    createCollectionMutation.mutate(payload);
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

    if (parsedEntries.length === 0) {
      setError('No valid M-Pesa messages were parsed. Paste one message per line.');
      return;
    }

    setError('');
    setNotice({
      severity: 'success',
      message: `${parsedEntries.length} M-Pesa messages parsed and ready for import.`,
    });
  };

  const handleImportStatementFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const csvText = await file.text();
      const { entries, skippedRows, totalRows } = parseMpesaStatementCsv(csvText);

      if (entries.length === 0) {
        setBatchParsedEntries([]);
        setError('No incoming completed M-Pesa receipts were found in the selected CSV statement.');
        setNotice(null);
        return;
      }

      const existingReferences = new Set(
        normalizedCollections
          .map((collection: any) => String(collection.reference_number || '').trim().toUpperCase())
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

        if (reference) {
          seenReferences.add(reference);
        }

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
      setError('');

      const summaryParts = [
        `${parsedEntries.length} receipts ready for import from ${file.name}.`,
        skippedRows > 0 ? `${skippedRows} non-receipt rows ignored.` : '',
        skippedExisting > 0 ? `${skippedExisting} existing references skipped.` : '',
        skippedDuplicatesInFile > 0 ? `${skippedDuplicatesInFile} duplicate references inside the file skipped.` : '',
        totalRows > 0 ? `${totalRows} statement rows read.` : '',
      ].filter(Boolean);

      setNotice({ severity: 'success', message: summaryParts.join(' ') });
    } catch (_error) {
      setBatchParsedEntries([]);
      setNotice(null);
      setError('The CSV statement could not be read. Use the Safaricom statement export without changing the columns.');
    } finally {
      event.target.value = '';
    }
  };

  const handleImportBatchMessages = async () => {
    if (!collectionData.committee_id) {
      setError('Select committee first before importing parsed entries.');
      return;
    }

    if (batchParsedEntries.length === 0) {
      setError('No parsed entries to import.');
      return;
    }

    const requests = batchParsedEntries.map((entry) =>
      financeService.createCollection({
        event: eventId,
        committee_id: collectionData.committee_id,
        source_type: (collectionData as any).source_type || 'GENERAL',
        cluster: (collectionData as any).source_type === 'CLUSTER' ? (collectionData as any).cluster : undefined,
        payer_name: entry.payer_name,
        payer_phone: entry.payer_phone || '',
        amount: entry.amount,
        channel: 'MPESA',
        reference_number: entry.reference_number || '',
        description: entry.description || '',
        recorded_at: entry.recorded_at,
      })
    );

    const results = await Promise.allSettled(requests);
    const failed = results.filter((r) => r.status === 'rejected').length;

    queryClient.invalidateQueries({ queryKey: ['collections', eventId] });
    queryClient.invalidateQueries({ queryKey: ['finance-summary'] });

    if (failed > 0) {
      setError(`${failed} entries failed to import. The rest were saved.`);
      setNotice({
        severity: 'warning',
        message: `${results.length - failed} entries were imported successfully.`,
      });
    } else {
      setError('');
      setNotice({
        severity: 'success',
        message: `${results.length} entries were imported successfully.`,
      });
    }

    setBatchParsedEntries([]);
    setBatchRawMessages('');
  };

  const handleUpdateParsedEntry = (
    index: number,
    field: keyof ParsedPaymentEntry,
    value: string | number
  ) => {
    setBatchParsedEntries((prev) =>
      prev.map((entry, i) =>
        i === index
          ? {
              ...entry,
              [field]: field === 'amount' ? Number(value) || 0 : value,
            }
          : entry
      )
    );
  };

  const handleRemoveParsedEntry = (index: number) => {
    setBatchParsedEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateExpense = () => {
    if (!expenseData.committee_id || !expenseData.vendor || !expenseData.amount) {
      setError('Please fill in all required fields');
      return;
    }
    createExpenseMutation.mutate(expenseData as ExpenseCreate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(numAmount);
  };

  if (collectionsLoading || expensesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Finance</Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Collections
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {formatCurrency(summary.total_collections || 0)}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Expenses
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {formatCurrency(summary.total_expenses || 0)}
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Balance
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      mt: 1,
                      color: (summary.balance || 0) >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatCurrency(summary.balance || 0)}
                  </Typography>
                </Box>
                <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Collections / Import" />
          <Tab label="Expenses" />
        </Tabs>
      </Paper>

      {/* Collections Tab */}
      {currentTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button component="label" variant="contained" startIcon={<UploadIcon />}>
              Import Statement CSV
              <input hidden accept=".csv,text/csv" type="file" onChange={handleImportStatementFile} />
            </Button>
          </Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>M-Pesa Statement Import</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Paste direct-payment M-Pesa messages or upload the Safaricom CSV statement, then preview and import the valid incoming receipts.
            </Typography>
            {notice && (
              <Alert severity={notice.severity} sx={{ mb: 2 }}>
                {notice.message}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Committee</InputLabel>
                  <Select
                    value={collectionData.committee_id || ''}
                    onChange={(e) =>
                      setCollectionData({ ...collectionData, committee_id: Number(e.target.value) })
                    }
                    label="Committee"
                  >
                    {committees?.map((committee) => (
                      <MenuItem key={committee.id} value={committee.id}>
                        {committee.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Source Type</InputLabel>
                  <Select
                    value={(collectionData as any).source_type || 'GENERAL'}
                    onChange={(e) =>
                      setCollectionData({
                        ...collectionData,
                        source_type: e.target.value as any,
                        cluster: e.target.value === 'CLUSTER' ? (collectionData as any).cluster : undefined,
                      })
                    }
                    label="Source Type"
                  >
                    <MenuItem value="GENERAL">Direct (Not from Cluster)</MenuItem>
                    <MenuItem value="CLUSTER">Cluster Unit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {(collectionData as any).source_type === 'CLUSTER' && (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Cluster Unit</InputLabel>
                    <Select
                      value={(collectionData as any).cluster || ''}
                      onChange={(e) =>
                        setCollectionData({ ...collectionData, cluster: e.target.value as any })
                      }
                      label="Cluster Unit"
                    >
                      {(clusters || []).map((cluster: any) => (
                        <MenuItem key={cluster.id} value={cluster.id}>
                          {cluster.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
            <TextField
              label="Paste M-Pesa Messages"
              multiline
              minRows={4}
              value={batchRawMessages}
              onChange={(e) => setBatchRawMessages(e.target.value)}
              placeholder="One M-Pesa message per line"
              fullWidth
            />
            <Box display="flex" gap={1} mt={2} flexWrap="wrap">
              <Button variant="outlined" startIcon={<AutoParseIcon />} onClick={handleParseBatchMessages}>
                Parse Messages
              </Button>
              <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
                Load Statement CSV
                <input hidden accept=".csv,text/csv" type="file" onChange={handleImportStatementFile} />
              </Button>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={handleImportBatchMessages}
                disabled={batchParsedEntries.length === 0}
              >
                Import Parsed ({batchParsedEntries.length})
              </Button>
            </Box>

            {batchParsedEntries.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Preview and Edit Parsed Entries
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 60 }}>#</TableCell>
                        <TableCell sx={{ width: 170 }}>Transaction Date</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell sx={{ width: 160 }}>Amount</TableCell>
                        <TableCell>Reference</TableCell>
                        <TableCell align="right" sx={{ width: 80 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batchParsedEntries.map((entry, index) => (
                        <TableRow key={`${entry.reference_number || 'entry'}-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{entry.transaction_date_text || '-'}</TableCell>
                          <TableCell>
                            <TextField
                              value={entry.payer_name}
                              size="small"
                              fullWidth
                              onChange={(e) => handleUpdateParsedEntry(index, 'payer_name', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={entry.payer_phone || ''}
                              size="small"
                              fullWidth
                              onChange={(e) => handleUpdateParsedEntry(index, 'payer_phone', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={entry.amount}
                              type="number"
                              size="small"
                              fullWidth
                              onChange={(e) => handleUpdateParsedEntry(index, 'amount', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={entry.reference_number || ''}
                              size="small"
                              fullWidth
                              onChange={(e) => handleUpdateParsedEntry(index, 'reference_number', e.target.value)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveParsedEntry(index)}
                              aria-label="remove parsed row"
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>

          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCollectionDialog(true)}
            >
              Record Collection
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payer Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Channel</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Committee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Recorded By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collectionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : normalizedCollections.length > 0 ? (
                  normalizedCollections.map((collection: any) => (
                    <TableRow key={collection.id} hover>
                      <TableCell>{collection.payer_name || collection.source_type_display || 'N/A'}</TableCell>
                      <TableCell>{collection.payer_phone || collection.payer_phone_number || '-'}</TableCell>
                      <TableCell>{formatCurrency(collection.amount)}</TableCell>
                      <TableCell>
                        <Chip label={collection.channel || collection.source_type_display || 'N/A'} size="small" />
                      </TableCell>
                      <TableCell>{collection.reference_number || collection.reference || '-'}</TableCell>
                      <TableCell>{collection.committee?.name || collection.committee_name || '-'}</TableCell>
                      <TableCell>
                        {new Date(collection.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{collection.recorded_by?.full_name || collection.recorded_by_name || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No collections recorded</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Expenses Tab */}
      {currentTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenExpenseDialog(true)}
            >
              Record Expense
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Committee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expensesLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : normalizedExpenses.length > 0 ? (
                  normalizedExpenses.map((expense: any) => (
                    <TableRow key={expense.id} hover>
                      <TableCell>{expense.vendor || expense.budget_item_name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <Chip label={expense.category || 'GENERAL'} size="small" color="primary" />
                      </TableCell>
                      <TableCell>{expense.committee?.name || expense.committee_name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={expense.status}
                          color={getStatusColor(expense.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(expense.created_at || expense.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{expense.requested_by?.full_name || expense.requested_by_name || '-'}</TableCell>
                      <TableCell>
                        {hasRole(['finance_member', 'executive_admin']) && expense.status === 'PENDING' && (
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => approveExpenseMutation.mutate(expense.id)}
                            >
                              Approve
                            </Button>
                            <Button size="small" variant="outlined" color="error">
                              Reject
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No expenses recorded</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Collection Dialog */}
      <Dialog
        open={openCollectionDialog}
        onClose={() => setOpenCollectionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Collection</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Paste M-Pesa Message"
              fullWidth
              multiline
              minRows={3}
              value={mpesaRawMessage}
              onChange={(e) => setMpesaRawMessage(e.target.value)}
              placeholder="Paste the full M-Pesa SMS here to auto-fill fields"
            />
            <Button variant="outlined" startIcon={<AutoParseIcon />} onClick={handleParseMpesaMessage}>
              Parse M-Pesa Message
            </Button>
            <FormControl fullWidth required>
              <InputLabel>Committee</InputLabel>
              <Select
                value={collectionData.committee_id || ''}
                onChange={(e) =>
                  setCollectionData({ ...collectionData, committee_id: Number(e.target.value) })
                }
                label="Committee"
              >
                {committees?.map((committee) => (
                  <MenuItem key={committee.id} value={committee.id}>
                    {committee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Source Type</InputLabel>
              <Select
                value={(collectionData as any).source_type || 'GENERAL'}
                onChange={(e) =>
                  setCollectionData({
                    ...collectionData,
                    source_type: e.target.value as any,
                    cluster: e.target.value === 'CLUSTER' ? (collectionData as any).cluster : undefined,
                  })
                }
                label="Source Type"
              >
                <MenuItem value="GENERAL">Direct (Not from Cluster)</MenuItem>
                <MenuItem value="CLUSTER">Cluster Unit</MenuItem>
              </Select>
            </FormControl>
            {(collectionData as any).source_type === 'CLUSTER' && (
              <FormControl fullWidth required>
                <InputLabel>Cluster Unit</InputLabel>
                <Select
                  value={(collectionData as any).cluster || ''}
                  onChange={(e) =>
                    setCollectionData({ ...collectionData, cluster: e.target.value as any })
                  }
                  label="Cluster Unit"
                >
                  {(clusters || []).map((cluster: any) => (
                    <MenuItem key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Payer Name"
              fullWidth
              required
              value={collectionData.payer_name}
              onChange={(e) =>
                setCollectionData({ ...collectionData, payer_name: e.target.value })
              }
            />
            <TextField
              label="Payer Phone"
              fullWidth
              value={collectionData.payer_phone}
              onChange={(e) =>
                setCollectionData({ ...collectionData, payer_phone: e.target.value })
              }
            />
            <TextField
              label="Amount"
              type="number"
              fullWidth
              required
              value={collectionData.amount}
              onChange={(e) =>
                setCollectionData({ ...collectionData, amount: parseFloat(e.target.value) })
              }
            />
            <FormControl fullWidth required>
              <InputLabel>Payment Channel</InputLabel>
              <Select
                value={collectionData.channel}
                onChange={(e) =>
                  setCollectionData({ ...collectionData, channel: e.target.value as any })
                }
                label="Payment Channel"
              >
                <MenuItem value="MPESA">M-Pesa</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="BANK">Bank Transfer</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Reference Number"
              fullWidth
              value={collectionData.reference_number}
              onChange={(e) =>
                setCollectionData({ ...collectionData, reference_number: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCollectionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCollection}
            variant="contained"
            disabled={createCollectionMutation.isPending}
          >
            {createCollectionMutation.isPending ? 'Recording...' : 'Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog
        open={openExpenseDialog}
        onClose={() => setOpenExpenseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Expense</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Committee</InputLabel>
              <Select
                value={expenseData.committee_id || ''}
                onChange={(e) =>
                  setExpenseData({ ...expenseData, committee_id: Number(e.target.value) })
                }
                label="Committee"
              >
                {committees?.map((committee) => (
                  <MenuItem key={committee.id} value={committee.id}>
                    {committee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Vendor Name"
              fullWidth
              required
              value={expenseData.vendor}
              onChange={(e) => setExpenseData({ ...expenseData, vendor: e.target.value })}
            />
            <TextField
              label="Amount"
              type="number"
              fullWidth
              required
              value={expenseData.amount}
              onChange={(e) =>
                setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) })
              }
            />
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={expenseData.category}
                onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value as any })}
                label="Category"
              >
                <MenuItem value="VENUE">Venue</MenuItem>
                <MenuItem value="CATERING">Catering</MenuItem>
                <MenuItem value="TRANSPORT">Transport</MenuItem>
                <MenuItem value="EQUIPMENT">Equipment</MenuItem>
                <MenuItem value="MARKETING">Marketing</MenuItem>
                <MenuItem value="MISCELLANEOUS">Miscellaneous</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={expenseData.description}
              onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpenseDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateExpense}
            variant="contained"
            disabled={createExpenseMutation.isPending}
          >
            {createExpenseMutation.isPending ? 'Recording...' : 'Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinancePage;
