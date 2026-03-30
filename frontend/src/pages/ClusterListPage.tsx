import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
} from '@mui/material';
import { Add, People, AttachMoney, ArrowForward } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Cluster List Page - Funds Mobilisation Module
 * Shows all fundraising clusters for an event
 */
const ClusterListPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const clusters = [
    {
      id: 1,
      name: 'North Region',
      leader: 'John Kamau',
      members: 25,
      totalCollected: 250000,
      targetAmount: 300000,
    },
    {
      id: 2,
      name: 'South Region',
      leader: 'Mary Wanjiru',
      members: 18,
      totalCollected: 180000,
      targetAmount: 200000,
    },
  ];

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

      <Grid container spacing={3}>
        {clusters.map((cluster) => (
          <Grid item xs={12} md={6} lg={4} key={cluster.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="h6">{cluster.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Led by {cluster.leader}
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
                        label={`${cluster.members} members`}
                        size="small"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip
                        icon={<AttachMoney />}
                        label={`KES ${cluster.totalCollected.toLocaleString()}`}
                        size="small"
                        color="success"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    Target: KES {cluster.targetAmount.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ClusterListPage;
