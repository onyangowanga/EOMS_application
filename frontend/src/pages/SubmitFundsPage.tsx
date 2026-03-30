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
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

/**
 * Submit Funds to Treasurer Page - Funds Mobilisation Module
 * Cluster lead submits collected funds to treasurer
 */
const SubmitFundsPage: React.FC = () => {
  const { eventId, clusterId } = useParams<{ eventId: string; clusterId: string }>();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement fund submission
    console.log('Submitting funds:', { amount, notes });
    setSubmitted(true);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Submit Funds to Treasurer
      </Typography>

      <Card sx={{ mb: 3, maxWidth: 600 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Funds collected by your cluster
          </Typography>
          <Typography variant="h4">KES 250,000</Typography>
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
            >
              Submit to Treasurer
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default SubmitFundsPage;
