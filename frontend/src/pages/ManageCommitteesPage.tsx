import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';

/**
 * Manage Committees Page - Admin Module
 * Admin page to manage all committees across all events
 */
const ManageCommitteesPage: React.FC = () => {
  const committees = [
    {
      id: 1,
      name: 'Main Committee',
      event: 'Annual Fundraiser',
      members: 12,
      status: 'Active',
    },
    {
      id: 2,
      name: 'Finance Committee',
      event: 'Annual Fundraiser',
      members: 5,
      status: 'Active',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Manage Committees</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Create Committee
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Committee Name</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {committees.map((committee) => (
              <TableRow key={committee.id}>
                <TableCell>{committee.name}</TableCell>
                <TableCell>{committee.event}</TableCell>
                <TableCell>{committee.members}</TableCell>
                <TableCell>
                  <Chip
                    label={committee.status}
                    size="small"
                    color={committee.status === 'Active' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small">
                    <Visibility />
                  </IconButton>
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManageCommitteesPage;
