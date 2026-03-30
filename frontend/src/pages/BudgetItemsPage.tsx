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
import { Add } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

/**
 * Budget Items Page - Budget & Finance Module
 * Lists budget items with approval status
 */
const BudgetItemsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const budgetItems = [
    { id: 1, name: 'Stage Setup', amount: 50000, category: 'Venue', status: 'APPROVED' },
    { id: 2, name: 'Catering', amount: 150000, category: 'Food', status: 'PENDING' },
    { id: 3, name: 'Sound System', amount: 75000, category: 'Equipment', status: 'APPROVED' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Budget Items</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Add Budget Item
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Amount (KES)</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {budgetItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell align="right">{item.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={item.status}
                    size="small"
                    color={item.status === 'APPROVED' ? 'success' : 'warning'}
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

export default BudgetItemsPage;
