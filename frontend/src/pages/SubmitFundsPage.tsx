import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { eventService } from '../services/event.service';

/**
 * Submit Funds to Treasurer Page - Funds Mobilisation Module
 * Cluster lead submits collected funds to treasurer
 */
const SubmitFundsPage: React.FC = () => {
  const { eventId, clusterId } = useParams<{ eventId: string; clusterId: string }>();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState('MPESA');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: cluster, isLoading } = useQuery({
    queryKey: ['cluster', clusterId],
    queryFn: () => eventService.getCluster(clusterId!),
    enabled: !!clusterId,
    refetchInterval: 10000,
  });

  const submitFundsMutation = useMutation({
    mutationFn: () => eventService.createClusterDeposit({
      cluster: clusterId!,
      amount: parseFloat(amount),
      deposit_channel: channel,
      reference_number: referenceNumber,
      notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster', clusterId] });
      queryClient.invalidateQueries({ queryKey: ['cluster-deposits', clusterId] });
      queryClient.invalidateQueries({ queryKey: ['cluster-deposits', eventId] });
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFundsMutation.mutate();
  };

  const formatCurrency = (value?: string) =>
    `KES ${parseFloat(value || '0').toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading || !cluster) {
    return <Skeleton variant="rectangular" height={280} />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Submit Funds to Treasurer
      </Typography>

      <Card sx={{ mb: 3, maxWidth: 600 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Funds currently pending submission
          </Typography>
          <Typography variant="h4">{formatCurrency(cluster.pending_in_lead_account)}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cluster: {cluster.name}
          </Typography>
        </CardContent>
      </Card>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        {submitted ? (
          <Alert severity="success">
            Funds submitted successfully! Awaiting treasurer confirmation.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Amount to Submit (KES)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              sx={{ mb: 2 }}
              inputProps={{ min: 0, step: '0.01' }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Submission Mode</InputLabel>
              <Select
                value={channel}
                label="Submission Mode"
                onChange={(e) => setChannel(e.target.value)}
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="MPESA">M-Pesa</MenuItem>
                <MenuItem value="BANK">Bank Transfer</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Reference Number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 3 }}
              placeholder="Add any notes about this submission..."
            />

            <Button
              variant="contained"
              type="submit"
              startIcon={<Send />}
              size="large"
              disabled={submitFundsMutation.isPending}
            >
              {submitFundsMutation.isPending ? 'Submitting...' : 'Submit to Treasurer'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default SubmitFundsPage;
