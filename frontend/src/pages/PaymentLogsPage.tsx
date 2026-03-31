import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '../services/event.service';
import type { ExpensePhase6 } from '../types';
import ResponsiveDataView from '../components/ResponsiveDataView';

/**
 * Payment Logs Page - Budget & Finance Module (Treasurer)
 * View all payment transactions and logs
 */
const PaymentLogsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['payment-logs', eventId],
    queryFn: () => eventService.getEventExpenses(eventId!),
    enabled: !!eventId,
  });

  const normalizedExpenses: ExpensePhase6[] = Array.isArray(expenses)
    ? expenses
    : ((expenses as any)?.results || []);

  const paidExpenses = normalizedExpenses.filter((expense) => expense.status === 'PAID');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payment Logs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Paid transactions stay tabular on desktop and collapse into quick-scan payment cards on mobile.
      </Typography>

      {isLoading ? (
        <Box>
          <Skeleton variant="rectangular" height={56} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load payment logs from backend.</Alert>
      ) : (
      <ResponsiveDataView
        data={paidExpenses as any[]}
        getRowId={(payment) => payment.id}
        emptyMessage="No paid transactions found for this event."
        tableAriaLabel="Payment logs"
        columns={[
          { key: 'date', label: 'Date', render: (payment) => new Date(payment.paid_at || payment.updated_at || payment.created_at).toLocaleDateString() },
          { key: 'description', label: 'Description', render: (payment) => payment.description || payment.budget_item_name || 'Payment' },
          { key: 'recipient', label: 'Recipient', render: (payment) => payment.vendor || payment.budget_item_name || 'N/A' },
          { key: 'amount', label: 'Amount (KES)', align: 'right', render: (payment) => parseFloat(payment.amount || '0').toLocaleString() },
          { key: 'status', label: 'Status', render: (payment) => <Chip label={payment.status} size="small" color={payment.status === 'PAID' ? 'success' : 'warning'} /> },
        ]}
        mobileTitle={(payment) => payment.vendor || payment.budget_item_name || 'Payment'}
        mobileSubtitle={(payment) => payment.description || 'Paid transaction'}
        mobileFields={[
          { label: 'Date', render: (payment) => new Date(payment.paid_at || payment.updated_at || payment.created_at).toLocaleDateString() },
          { label: 'Amount', render: (payment) => `KES ${parseFloat(payment.amount || '0').toLocaleString()}` },
          { label: 'Status', render: (payment) => <Chip label={payment.status} size="small" color={payment.status === 'PAID' ? 'success' : 'warning'} /> },
          { label: 'Description', render: (payment) => payment.description || payment.budget_item_name || 'Payment' },
        ]}
      />
      )}
    </Box>
  );
};

export default PaymentLogsPage;
