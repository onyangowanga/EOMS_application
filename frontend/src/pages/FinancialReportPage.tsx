import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

/**
 * Financial Report Page - Reports Module
 * Detailed financial report for the event
 */
const FinancialReportPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const transactions = [
    { id: 1, date: '2026-03-28', description: 'Stage Setup Payment', type: 'EXPENSE', amount: -50000 },
    { id: 2, date: '2026-03-29', description: 'Cluster North Collection', type: 'INCOME', amount: 250000 },
    { id: 3, date: '2026-03-30', description: 'Catering Deposit', type: 'EXPENSE', amount: -75000 },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Financial Report</Typography>
        <Button variant="contained" startIcon={<Download />}>
          Export to Excel
        </Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Income
              </Typography>
              <Typography variant="h5" color="success.main">
                KES 1,200,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Expenses
              </Typography>
              <Typography variant="h5" color="error.main">
                KES 900,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Net Balance
              </Typography>
              <Typography variant="h5">KES 300,000</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Typography variant="h6" sx={{ p: 2 }}>
          Transaction History
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount (KES)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: transaction.amount < 0 ? 'error.main' : 'success.main',
                    }}
                  >
                    {transaction.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default FinancialReportPage;
