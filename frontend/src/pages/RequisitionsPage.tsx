import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/event.service';
import { financeService } from '../services/finance.service';

/**
 * Requisitions Page - Budget & Finance Module
 * Create and manage financial requisitions
 */
const RequisitionsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    budgetItemId: '',
  });

  const [submitError, setSubmitError] = useState('');

  const { data: budgetItems, isLoading: loadingBudgetItems } = useQuery({
    queryKey: ['requisition-budget-items', eventId],
    queryFn: () => eventService.getEventBudgetItems(eventId!),
    enabled: !!eventId,
  });

  const normalizedBudgetItems = Array.isArray(budgetItems)
    ? budgetItems
    : ((budgetItems as any)?.results || []);

  const selectedBudgetItem = normalizedBudgetItems.find((item: any) => String(item.id) === formData.budgetItemId);

  const createRequisitionMutation = useMutation({
    mutationFn: () => {
      if (!selectedBudgetItem) {
        throw new Error('Please select a budget item');
      }

      if (!selectedBudgetItem.committee) {
        throw new Error('Selected budget item is not attached to a committee. Ask finance to attach it first.');
      }

      return financeService.createExpense({
        event: eventId,
        committee_id: selectedBudgetItem.committee,
        budget_item: selectedBudgetItem.id,
        vendor: formData.title.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category || 'OTHER',
        description: formData.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', eventId] });
      queryClient.invalidateQueries({ queryKey: ['budget-items', eventId] });
      navigate(`/events/${eventId}/budget`);
    },
    onError: (error: any) => {
      setSubmitError(error?.response?.data?.error || 'Failed to submit requisition');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.budgetItemId) {
      setSubmitError('Please select a budget item');
      return;
    }

    if (!formData.title.trim()) {
      setSubmitError('Requisition title is required');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setSubmitError('Amount must be greater than zero');
      return;
    }

    createRequisitionMutation.mutate();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create Requisition
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel>Budget Item</InputLabel>
            <Select
              value={formData.budgetItemId}
              label="Budget Item"
              onChange={(e) => setFormData({ ...formData, budgetItemId: e.target.value })}
            >
              {normalizedBudgetItems.map((item: any) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.item_name} ({item.committee_name || 'Unassigned'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Requisition Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Amount (KES)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <MenuItem value="VENUE">Venue</MenuItem>
              <MenuItem value="FOOD">Food & Catering</MenuItem>
              <MenuItem value="EQUIPMENT">Equipment</MenuItem>
              <MenuItem value="SERVICE">Service</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>

          <Box display="flex" gap={2}>
            <Button variant="contained" type="submit" disabled={createRequisitionMutation.isPending || loadingBudgetItems}>
              {createRequisitionMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Submit Requisition'}
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default RequisitionsPage;
