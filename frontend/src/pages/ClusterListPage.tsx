import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import { Add, People, AttachMoney, ArrowForward } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '../services/event.service';
import type { ClusterGroup } from '../types';

/**
 * Cluster List Page - Funds Mobilisation Module
 * Shows all fundraising clusters for an event
 */
const ClusterListPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: clusters = [], isLoading } = useQuery({
    queryKey: ['clusters', eventId, 'list'],
    queryFn: () => eventService.getEventClusters(eventId!),
    enabled: !!eventId,
    refetchInterval: 10000,
  });

  const formatCurrency = (amount?: string) =>
    `KES ${parseFloat(amount || '0').toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Fundraising Clusters</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate(`/events/${eventId}/clusters/create`)}
        >
          Create Cluster
        </Button>
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={220} />
            </Grid>
          ))}
        </Grid>
      ) : (
      <Grid container spacing={3}>
        {clusters.map((cluster: ClusterGroup) => (
          <Grid item xs={12} md={6} lg={4} key={cluster.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="h6">{cluster.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Led by {cluster.cluster_lead_name || 'Unassigned'}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={() =>
                      navigate(`/events/${eventId}/clusters/${cluster.id}/details`)
                    }
                  >
                    View
                  </Button>
                </Box>

                <Box mt={2}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Chip
                        icon={<People />}
                        label={`Pledges: ${formatCurrency(cluster.pledged_amount)}`}
                        size="small"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip
                        icon={<AttachMoney />}
                        label={formatCurrency(cluster.collected_amount)}
                        size="small"
                        color="success"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    Target: {formatCurrency(cluster.target_amount)}
                  </Typography>
                </Box>
                <Box mt={1.5}>
                  <Typography variant="caption" color="text.secondary">
                    Progress: {parseFloat(cluster.progress_percentage || '0').toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(parseFloat(cluster.progress_percentage || '0'), 100)}
                    sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      )}
    </Box>
  );
};

export default ClusterListPage;
