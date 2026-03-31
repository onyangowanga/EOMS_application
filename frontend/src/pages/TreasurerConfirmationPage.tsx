import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  Skeleton,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { eventService } from '../services/event.service';
import ResponsiveDataView from '../components/ResponsiveDataView';

/**
 * Treasurer Confirmation Page - Funds Mobilisation Module
 * Treasurer reviews and confirms cluster fund submissions
 */
const TreasurerConfirmationPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['cluster-deposits', eventId, 'treasurer-confirmations'],
    queryFn: () => eventService.getClusterDeposits(eventId!),
    enabled: !!eventId,
    refetchInterval: 10000,
  });

  const confirmDepositMutation = useMutation({
    mutationFn: (depositId: string) => eventService.confirmClusterDeposit(depositId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-deposits', eventId] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary', eventId] });
    },
  });

  const pendingSubmissions = submissions.filter((submission: any) => !submission.confirmed_by_treasurer);

  if (isLoading) {
    return <Skeleton variant="rectangular" height={300} />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cluster Fund Submissions
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Review cluster deposits in a full desktop table or confirm them directly from mobile cards.
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Confirm submitted cluster funds here. Confirmed submissions flow into treasury totals automatically.
      </Alert>

      <ResponsiveDataView
        data={pendingSubmissions as any[]}
        getRowId={(submission) => submission.id}
        emptyMessage="No pending cluster submissions"
        tableAriaLabel="Pending cluster submissions"
        columns={[
          { key: 'cluster', label: 'Cluster', render: (submission) => submission.cluster_name },
          { key: 'mode', label: 'Mode', render: (submission) => submission.deposit_channel_display || submission.deposit_channel },
          { key: 'date', label: 'Submitted Date', render: (submission) => new Date(submission.created_at).toLocaleDateString() },
          { key: 'amount', label: 'Amount (KES)', align: 'right', render: (submission) => parseFloat(submission.amount || '0').toLocaleString() },
          { key: 'status', label: 'Status', render: (submission) => <Chip label={submission.confirmed_by_treasurer ? 'CONFIRMED' : 'PENDING'} size="small" color={submission.confirmed_by_treasurer ? 'success' : 'warning'} /> },
        ]}
        mobileTitle={(submission) => submission.cluster_name}
        mobileSubtitle={(submission) => submission.deposit_channel_display || submission.deposit_channel}
        mobileFields={[
          { label: 'Submitted', render: (submission) => new Date(submission.created_at).toLocaleDateString() },
          { label: 'Amount', render: (submission) => `KES ${parseFloat(submission.amount || '0').toLocaleString()}` },
          { label: 'Status', render: (submission) => <Chip label={submission.confirmed_by_treasurer ? 'CONFIRMED' : 'PENDING'} size="small" color={submission.confirmed_by_treasurer ? 'success' : 'warning'} /> },
        ]}
        rowActions={(submission) => (
          !submission.confirmed_by_treasurer ? (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => confirmDepositMutation.mutate(submission.id)}
            >
              Confirm
            </Button>
          ) : null
        )}
      />
    </Box>
  );
};

export default TreasurerConfirmationPage;
