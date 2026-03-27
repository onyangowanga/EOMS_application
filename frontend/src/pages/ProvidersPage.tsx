import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerService } from '../services/provider.service';
import { committeeService } from '../services/committee.service';
import type { ServiceProvider, ServiceProviderCreate } from '../types/index';

const ProvidersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<ServiceProviderCreate>>({
    committee_id: undefined,
    provider_type: 'MORTUARY',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    cost_estimate: 0,
  });

  const statusSteps = ['QUOTED', 'BOOKED', 'CONFIRMED', 'PAID', 'COMPLETED'];

  // Fetch providers
  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providerService.getAll(),
  });

  const { data: committees } = useQuery({
    queryKey: ['committees'],
    queryFn: committeeService.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: providerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create provider');
    },
  });

  const resetForm = () => {
    setFormData({
      committee_id: undefined,
      provider_type: 'MORTUARY',
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      cost_estimate: 0,
    });
    setError('');
  };

  const handleSubmit = () => {
    if (!formData.committee_id || !formData.name || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }
    createMutation.mutate(formData as ServiceProviderCreate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUOTED':
        return 'default';
      case 'BOOKED':
        return 'info';
      case 'CONFIRMED':
        return 'primary';
      case 'PAID':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(numAmount);
  };

  const filteredProviders = providers?.filter((provider: ServiceProvider) => {
    return filterType === 'ALL' || provider.provider_type === filterType;
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Service Providers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Provider
        </Button>
      </Box>

      {/* Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Provider Type</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Provider Type"
          >
            <MenuItem value="ALL">All Types</MenuItem>
            <MenuItem value="MORTUARY">Mortuary</MenuItem>
            <MenuItem value="TRANSPORT">Transport</MenuItem>
            <MenuItem value="CATERING">Catering</MenuItem>
            <MenuItem value="VENUE">Venue</MenuItem>
            <MenuItem value="EQUIPMENT">Equipment</MenuItem>
            <MenuItem value="PRINTING">Printing</MenuItem>
            <MenuItem value="MUSIC">Music/Entertainment</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Providers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Provider Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Cost Estimate</TableCell>
              <TableCell>Actual Cost</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Committee</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProviders && filteredProviders.length > 0 ? (
              filteredProviders.map((provider: ServiceProvider) => (
                <TableRow key={provider.id} hover>
                  <TableCell>{provider.name}</TableCell>
                  <TableCell>
                    <Chip label={provider.provider_type} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{provider.contact_person}</TableCell>
                  <TableCell>{provider.phone}</TableCell>
                  <TableCell>{provider.cost_estimate ? formatCurrency(provider.cost_estimate) : '-'}</TableCell>
                  <TableCell>
                    {provider.actual_cost ? formatCurrency(provider.actual_cost) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={provider.status}
                      color={getStatusColor(provider.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{provider.committee.name}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small" color="secondary">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary">No providers found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Service Provider</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Committee</InputLabel>
              <Select
                value={formData.committee_id || ''}
                onChange={(e) => setFormData({ ...formData, committee_id: e.target.value as number })}
                label="Committee"
              >
                {committees?.map((committee) => (
                  <MenuItem key={committee.id} value={committee.id}>
                    {committee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Provider Type</InputLabel>
              <Select
                value={formData.provider_type}
                onChange={(e) =>
                  setFormData({ ...formData, provider_type: e.target.value as any })
                }
                label="Provider Type"
              >
                <MenuItem value="MORTUARY">Mortuary</MenuItem>
                <MenuItem value="TRANSPORT">Transport</MenuItem>
                <MenuItem value="CATERING">Catering</MenuItem>
                <MenuItem value="VENUE">Venue</MenuItem>
                <MenuItem value="EQUIPMENT">Equipment</MenuItem>
                <MenuItem value="PRINTING">Printing</MenuItem>
                <MenuItem value="MUSIC">Music/Entertainment</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Provider Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Contact Person"
              fullWidth
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="Cost Estimate"
              type="number"
              fullWidth
              value={formData.cost_estimate}
              onChange={(e) =>
                setFormData({ ...formData, cost_estimate: parseFloat(e.target.value) })
              }
            />
          </Box>

          {/* Status Stepper Preview */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Status Workflow:
            </Typography>
            <Stepper activeStep={0} alternativeLabel>
              {statusSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Provider'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProvidersPage;
