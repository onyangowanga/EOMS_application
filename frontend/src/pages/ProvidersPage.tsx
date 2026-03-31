import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
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
  Stack,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerService } from '../services/provider.service';
import { committeeService } from '../services/committee.service';
import type { ServiceProvider, ServiceProviderCreate } from '../types/index';
import ResponsiveDataView from '../components/ResponsiveDataView';

const ProvidersPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4">Service Providers</Typography>
          <Typography variant="body1" color="text.secondary">
            Vendor records stay dense and sortable on desktop while mobile shifts them into compact service cards.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          fullWidth={isMobile}
        >
          Add Provider
        </Button>
      </Stack>

      {/* Filter */}
      <Paper sx={{ p: { xs: 2, md: 2.5 }, mb: 3, borderRadius: 5 }}>
        <FormControl fullWidth sx={{ maxWidth: { md: 320 } }}>
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

      <ResponsiveDataView
        data={filteredProviders || []}
        getRowId={(provider) => provider.id}
        emptyMessage="No providers found"
        tableAriaLabel="Service providers"
        columns={[
          { key: 'name', label: 'Provider Name', render: (provider) => provider.name },
          { key: 'type', label: 'Type', render: (provider) => <Chip label={provider.provider_type} size="small" color="primary" /> },
          { key: 'contact', label: 'Contact Person', render: (provider) => provider.contact_person || '-' },
          { key: 'phone', label: 'Phone', render: (provider) => provider.phone },
          { key: 'estimate', label: 'Cost Estimate', render: (provider) => provider.cost_estimate ? formatCurrency(provider.cost_estimate) : '-', align: 'right' },
          { key: 'actual', label: 'Actual Cost', render: (provider) => provider.actual_cost ? formatCurrency(provider.actual_cost) : '-', align: 'right' },
          { key: 'status', label: 'Status', render: (provider) => <Chip label={provider.status} color={getStatusColor(provider.status)} size="small" /> },
          { key: 'committee', label: 'Committee', render: (provider) => provider.committee.name },
        ]}
        mobileTitle={(provider) => provider.name}
        mobileSubtitle={(provider) => provider.committee.name}
        mobileFields={[
          { label: 'Type', render: (provider) => <Chip label={provider.provider_type} size="small" color="primary" /> },
          { label: 'Status', render: (provider) => <Chip label={provider.status} color={getStatusColor(provider.status)} size="small" /> },
          { label: 'Contact', render: (provider) => provider.contact_person || '-' },
          { label: 'Phone', render: (provider) => provider.phone },
          { label: 'Estimate', render: (provider) => provider.cost_estimate ? formatCurrency(provider.cost_estimate) : '-' },
          { label: 'Actual', render: (provider) => provider.actual_cost ? formatCurrency(provider.actual_cost) : '-' },
        ]}
        rowActions={() => (
          <Box display="flex" justifyContent="flex-end" gap={0.5}>
            <IconButton size="small" color="primary">
              <VisibilityIcon />
            </IconButton>
            <IconButton size="small" color="secondary">
              <EditIcon />
            </IconButton>
          </Box>
        )}
      />

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
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
                onChange={(e) => setFormData({ ...formData, committee_id: Number(e.target.value) })}
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
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                setFormData({ ...formData, cost_estimate: isNaN(value) ? 0 : value });
              }}
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
