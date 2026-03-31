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
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../services/finance.service';
import { committeeService } from '../services/committee.service';
import { eventService } from '../services/event.service';
import type { CollectionCreate, ExpenseCreate } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

const FinancePage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);
  const [openCollectionDialog, setOpenCollectionDialog] = useState(false);
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [error, setError] = useState('');
  
  const [collectionData, setCollectionData] = useState<Partial<CollectionCreate>>({
    committee_id: undefined,
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
      payer_name: '',
      payer_phone: '',
      amount: 0,
      channel: 'MPESA',
      reference_number: '',
    });
    setError('');
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
  };

  const handleCreateCollection = () => {
    if (!collectionData.committee_id || !collectionData.payer_name || !collectionData.amount) {
      setError('Please fill in all required fields');
      return;
    }
    createCollectionMutation.mutate(collectionData as CollectionCreate);
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
          <Tab label="Collections" />
          <Tab label="Expenses" />
        </Tabs>
      </Paper>

      {/* Collections Tab */}
      {currentTab === 0 && (
        <Box>
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
