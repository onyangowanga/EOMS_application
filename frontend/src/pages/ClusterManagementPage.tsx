import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  Stack,
  MenuItem,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { eventService } from '../services/event.service';
import type { ClusterGroup } from '../types';

/**
 * ClusterManagementPage - Comprehensive cluster fund mobilization management
 * 
 * Features:
 * - Grid of cluster cards with progress visualization
 * - Create/edit cluster dialog
 * - Summary statistics (total target, collected, remaining)
 * - Cluster detail view with contributions and deposits
 * - Mobile-responsive design with stacked layout on small screens
 */

// Cluster form data interface
interface ClusterFormData {
  name: string;
  target_amount: string;
  leader?: string;
  description?: string;
}

// Cluster statistics interface
interface ClusterStats {
  totalClusters: number;
  totalTarget: number;
  totalCollected: number;
  totalBalance: number;
  averageProgress: number;
}

const ClusterManagementPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCluster, setEditingCluster] = useState<ClusterGroup | null>(null);
  const [formData, setFormData] = useState<ClusterFormData>({
    name: '',
    target_amount: '',
    leader: undefined,
    description: '',
  });
  const [formError, setFormError] = useState<string>('');

  // Fetch clusters
  const { data: clusters, isLoading, error } = useQuery({
    queryKey: ['clusters', eventId],
    queryFn: () => eventService.getEventClusters(eventId!),
    enabled: !!eventId,
  });

  const { data: eventMembers = [] } = useQuery({
    queryKey: ['event-members', eventId],
    queryFn: () => eventService.getEventMembers(eventId!),
    enabled: !!eventId,
  });

  const normalizedClusters: ClusterGroup[] = Array.isArray(clusters)
    ? clusters
    : ((clusters as any)?.results || []);

  // Create cluster mutation
  const createClusterMutation = useMutation({
    mutationFn: (data: any) => eventService.createCluster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      const data = error.response?.data;
      if (typeof data === 'string') {
        setFormError(data);
        return;
      }
      if (data && typeof data === 'object') {
        const firstFieldError = Object.values(data)[0];
        if (Array.isArray(firstFieldError) && firstFieldError[0]) {
          setFormError(String(firstFieldError[0]));
          return;
        }
      }
      setFormError(error.response?.data?.message || 'Failed to create cluster');
    },
  });

  // Calculate cluster statistics
  const calculateStats = (clusters: ClusterGroup[]): ClusterStats => {
    const stats = clusters.reduce(
      (acc, cluster) => {
        acc.totalTarget += parseFloat(cluster.target_amount || '0');
        acc.totalCollected += parseFloat(cluster.collected_amount || '0');
        return acc;
      },
      { totalTarget: 0, totalCollected: 0, totalBalance: 0, totalClusters: clusters.length, averageProgress: 0 }
    );

    stats.totalBalance = stats.totalTarget - stats.totalCollected;
    stats.averageProgress = stats.totalTarget > 0 
      ? (stats.totalCollected / stats.totalTarget) * 100 
      : 0;

    return stats;
  };

  const stats = calculateStats(normalizedClusters);

  // Handlers
  const handleOpenDialog = (cluster?: ClusterGroup) => {
    if (cluster) {
      setEditingCluster(cluster);
      setFormData({
        name: cluster.name,
        target_amount: cluster.target_amount || '',
        leader: String(cluster.cluster_lead || cluster.leader || ''),
        description: cluster.description || '',
      });
    } else {
      setEditingCluster(null);
      setFormData({
        name: '',
        target_amount: '',
        leader: undefined,
        description: '',
      });
    }
    setFormError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCluster(null);
    setFormData({
      name: '',
      target_amount: '',
      leader: undefined,
      description: '',
    });
    setFormError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name.trim()) {
      setFormError('Cluster name is required');
      return;
    }
    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      setFormError('Target amount must be greater than 0');
      return;
    }

    // Prepare data
    const submitData: any = {
      event: eventId!,
      name: formData.name.trim(),
      target_amount: formData.target_amount,
    };
    if (formData.leader && formData.leader.trim()) {
      const leaderId = Number.parseInt(formData.leader, 10);
      if (Number.isNaN(leaderId)) {
        setFormError('Please select a valid cluster leader');
        return;
      }
      submitData.cluster_lead = leaderId;
    }

    createClusterMutation.mutate(submitData);
  };

  const getProgressColor = (progress: number): 'error' | 'warning' | 'success' => {
    if (progress < 50) return 'error';
    if (progress < 75) return 'warning';
    return 'success';
  };

  const formatCurrency = (amount: number): string => {
    return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">
          Failed to load clusters. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
              Cluster Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage fund mobilization clusters and track contributions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            fullWidth={isMobile}
            sx={{ minHeight: 48 }} // Touch-friendly
          >
            Create Cluster
          </Button>
        </Stack>
      </Box>

      {/* Summary Statistics */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Overall Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Total Clusters
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {stats.totalClusters}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6} md={3}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Target Amount
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(stats.totalTarget)}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6} md={3}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Collected
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(stats.totalCollected)}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6} md={3}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Remaining
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {formatCurrency(stats.totalBalance)}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 1 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Overall Progress
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {stats.averageProgress.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(stats.averageProgress, 100)}
                    color={getProgressColor(stats.averageProgress)}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Clusters Grid */}
      {normalizedClusters.length > 0 ? (
        <Grid container spacing={2}>
          {normalizedClusters.map((cluster) => {
            const progress = cluster.target_amount
              ? (parseFloat(cluster.collected_amount || '0') / parseFloat(cluster.target_amount)) * 100
              : 0;
            const remaining = parseFloat(cluster.target_amount || '0') - parseFloat(cluster.collected_amount || '0');

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={cluster.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Cluster Name */}
                    <Typography variant="h6" gutterBottom noWrap title={cluster.name}>
                      {cluster.name}
                    </Typography>

                    {/* Leader Badge */}
                    {(cluster.cluster_lead_name || cluster.cluster_lead || cluster.leader) && (
                      <Chip 
                        icon={<PeopleIcon />} 
                        label={`Leader: ${cluster.cluster_lead_name || `User #${cluster.cluster_lead || cluster.leader}`}`}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Financial Metrics */}
                    <Stack spacing={1.5}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Target
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(parseFloat(cluster.target_amount || '0'))}
                          </Typography>
                        </Stack>
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Collected
                          </Typography>
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            {formatCurrency(parseFloat(cluster.collected_amount || '0'))}
                          </Typography>
                        </Stack>
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Remaining
                          </Typography>
                          <Typography variant="body2" color="warning.main" fontWeight="bold">
                            {formatCurrency(remaining)}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>

                    {/* Progress Bar */}
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {progress.toFixed(1)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(progress, 100)}
                        color={getProgressColor(progress)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Description */}
                    {cluster.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          mt: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {cluster.description}
                      </Typography>
                    )}
                  </CardContent>

                  {/* Action Buttons */}
                  <Box sx={{ p: 1.5, pt: 0 }}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/events/${eventId}/clusters/${cluster.id}/details`)}
                        fullWidth
                        sx={{ minHeight: 40 }} // Touch-friendly
                      >
                        View Details
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(cluster)}
                        color="primary"
                        sx={{ minWidth: 40, minHeight: 40 }} // Touch-friendly
                      >
                        <EditIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // Empty State
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Clusters Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first cluster to start tracking fund mobilization
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ minHeight: 48 }} // Touch-friendly
            >
              Create First Cluster
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Cluster Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile} // Full screen on mobile
      >
        <DialogTitle>
          {editingCluster ? 'Edit Cluster' : 'Create New Cluster'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}

            <TextField
              name="name"
              label="Cluster Name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
              placeholder="e.g., Church Group, Friends Group"
              helperText="Enter a descriptive name for this cluster"
            />

            <TextField
              name="target_amount"
              label="Target Amount (KSH)"
              type="number"
              value={formData.target_amount}
              onChange={handleInputChange}
              fullWidth
              required
              inputProps={{ min: 0, step: '0.01' }}
              placeholder="e.g., 500000"
              helperText="Target fund mobilization amount for this cluster"
            />

            <TextField
              name="leader"
              label="Cluster Leader"
              select
              value={formData.leader || ''}
              onChange={handleInputChange}
              fullWidth
              helperText="Optional: Select an event member as cluster leader"
            >
              <MenuItem value="">
                <em>No leader selected</em>
              </MenuItem>
              {eventMembers.map((member) => (
                <MenuItem key={member.id} value={String(member.user)}>
                  {member.full_name} ({member.role_display})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe the cluster and its objectives..."
              helperText="Optional: Additional details about this cluster"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ minHeight: 40 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createClusterMutation.isPending}
            sx={{ minHeight: 40 }}
          >
            {createClusterMutation.isPending ? 'Creating...' : editingCluster ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClusterManagementPage;
