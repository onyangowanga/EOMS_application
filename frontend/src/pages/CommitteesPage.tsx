import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { committeeService } from '../services/committee.service';
import type { Committee } from '../types/index';

const CommitteesPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: '',
    event_date: '',
    committee_type: 'OTHER',
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: committees, isLoading } = useQuery({
    queryKey: ['committees'],
    queryFn: committeeService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: committeeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees'] });
      setOpen(false);
      setFormData({ name: '', description: '', event_type: '', event_date: '', committee_type: 'OTHER' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'primary';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Committees</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Create Committee
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Event Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : committees && committees.length > 0 ? (
              committees.map((committee: Committee) => (
                <TableRow key={committee.id}>
                  <TableCell>{committee.name}</TableCell>
                  <TableCell>{committee.event_type}</TableCell>
                  <TableCell>
                    {new Date(committee.event_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={committee.status}
                      color={getStatusColor(committee.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(committee.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        // Check if committee has event field (Phase 6 structure)
                        const eventId = (committee as any).event;
                        if (eventId) {
                          navigate(`/events/${eventId}/subcommittees/${committee.id}`);
                        } else {
                          // Fallback for old structure - might not work
                          console.warn('Committee missing event field:', committee);
                          navigate(`/committees/${committee.id}`);
                        }
                      }}
                      size="small"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No committees found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Create New Committee</DialogTitle>
          <DialogContent>
            <TextField
              label="Committee Name"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            <TextField
              label="Event Type"
              fullWidth
              margin="normal"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              placeholder="e.g., Funeral, Wedding, Corporate Event"
              required
            />
            <TextField
              label="Event Date"
              type="date"
              fullWidth
              margin="normal"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Committee Type</InputLabel>
              <Select
                value={formData.committee_type}
                label="Committee Type"
                onChange={(e) => setFormData({ ...formData, committee_type: e.target.value })}
              >
                <MenuItem value="MAIN">Main Committee</MenuItem>
                <MenuItem value="BUDGET_FINANCE">Budget & Finance</MenuItem>
                <MenuItem value="FUNDS_MOBILIZATION">Funds Mobilization</MenuItem>
                <MenuItem value="LOGISTICS">Logistics</MenuItem>
                <MenuItem value="CATERING">Catering</MenuItem>
                <MenuItem value="VENUE">Venue</MenuItem>
                <MenuItem value="TRANSPORT">Transport</MenuItem>
                <MenuItem value="MEDIA">Media & Communications</MenuItem>
                <MenuItem value="SECURITY">Security</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CommitteesPage;
