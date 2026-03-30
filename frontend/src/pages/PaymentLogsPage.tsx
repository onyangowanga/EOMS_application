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
  Chip,
} from '@mui/material';
import { useParams } from 'react-router-dom';

/**
 * Payment Logs Page - Budget & Finance Module (Treasurer)
 * View all payment transactions and logs
 */
const PaymentLogsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const payments = [
    {
      id: 1,
      date: '2026-03-28',
      description: 'Stage Setup Payment',
      amount: 50000,
      recipient: 'ABC Events Ltd',
      status: 'PAID',
    },
    {
      id: 2,
      date: '2026-03-29',
      description: 'Sound System Deposit',
      amount: 25000,
      recipient: 'Sound Masters',
      status: 'PAID',
    },
    {
      id: 3,
      date: '2026-03-30',
      description: 'Catering Advance',
      amount: 75000,
      recipient: 'Delicious Catering',
      status: 'PENDING',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payment Logs
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Recipient</TableCell>
              <TableCell align="right">Amount (KES)</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.date}</TableCell>
                <TableCell>{payment.description}</TableCell>
                <TableCell>{payment.recipient}</TableCell>
                <TableCell align="right">{payment.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={payment.status}
                    size="small"
                    color={payment.status === 'PAID' ? 'success' : 'warning'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PaymentLogsPage;
