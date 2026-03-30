import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

/**
 * Treasurer Confirmation Page - Funds Mobilisation Module
 * Treasurer reviews and confirms cluster fund submissions
 */
const TreasurerConfirmationPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const submissions = [
    {
      id: 1,
      cluster: 'North Region',
      leader: 'John Kamau',
      amount: 250000,
      submittedDate: '2026-03-29',
      status: 'PENDING',
    },
    {
      id: 2,
      cluster: 'South Region',
      leader: 'Mary Wanjiru',
      amount: 180000,
      submittedDate: '2026-03-28',
      status: 'CONFIRMED',
    },
  ];

  const handleConfirm = (id: number) => {
    // TODO: Implement confirmation
    console.log('Confirming submission:', id);
  };

  const handleReject = (id: number) => {
    // TODO: Implement rejection
    console.log('Rejecting submission:', id);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cluster Fund Submissions
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cluster</TableCell>
              <TableCell>Leader</TableCell>
              <TableCell>Submitted Date</TableCell>
              <TableCell align="right">Amount (KES)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>{submission.cluster}</TableCell>
                <TableCell>{submission.leader}</TableCell>
                <TableCell>{submission.submittedDate}</TableCell>
                <TableCell align="right">{submission.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={submission.status}
                    size="small"
                    color={submission.status === 'CONFIRMED' ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell align="right">
                  {submission.status === 'PENDING' && (
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleConfirm(submission.id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleReject(submission.id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TreasurerConfirmationPage;
