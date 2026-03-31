import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Skeleton,
  Alert,
  Stack,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '../services/event.service';
import type { BudgetItem } from '../types';
import ResponsiveDataView from '../components/ResponsiveDataView';

/**
 * Budget Items Page - Budget & Finance Module
 * Lists budget items with approval status
 */
const BudgetItemsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { eventId } = useParams<{ eventId: string }>();

  const { data: budgetItems, isLoading, error } = useQuery({
    queryKey: ['budget-items-page', eventId],
    queryFn: () => eventService.getEventBudgetItems(eventId!),
    enabled: !!eventId,
  });

  const normalizedBudgetItems: BudgetItem[] = Array.isArray(budgetItems)
    ? budgetItems
    : ((budgetItems as any)?.results || []);

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4">Budget Items</Typography>
          <Typography variant="body1" color="text.secondary">
            Approved and pending allocations in a desktop ledger or mobile card grid.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} fullWidth={isMobile}>
          Add Budget Item
        </Button>
      </Stack>

      {isLoading ? (
        <Box>
          <Skeleton variant="rectangular" height={56} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load budget items from backend.</Alert>
      ) : (
      <ResponsiveDataView
        data={normalizedBudgetItems}
        getRowId={(item) => item.id}
        emptyMessage="No budget items found for this event."
        tableAriaLabel="Budget items"
        columns={[
          { key: 'item', label: 'Item Name', render: (item) => item.item_name || item.title },
          { key: 'committee', label: 'Committee', render: (item) => item.committee_name || 'Unassigned' },
          { key: 'amount', label: 'Amount (KES)', align: 'right', render: (item) => parseFloat(item.allocated_amount || '0').toLocaleString() },
          {
            key: 'status',
            label: 'Status',
            render: (item) => (
              <Chip
                label={item.status}
                size="small"
                color={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'}
              />
            ),
          },
        ]}
        mobileTitle={(item) => item.item_name || item.title || 'Budget Item'}
        mobileSubtitle={(item) => item.committee_name || 'Unassigned committee'}
        mobileFields={[
          { label: 'Amount', render: (item) => `KES ${parseFloat(item.allocated_amount || '0').toLocaleString()}` },
          { label: 'Status', render: (item) => <Chip label={item.status} size="small" color={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'} /> },
        ]}
      />
      )}
    </Box>
  );
};

export default BudgetItemsPage;
