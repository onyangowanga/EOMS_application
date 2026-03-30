import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useParams } from 'react-router-dom';

/**
 * Cluster Details Page - Funds Mobilisation Module
 * Shows overview, daily reports, members, and pledges for a cluster
 */
const ClusterDetailsPage: React.FC = () => {
  const { eventId, clusterId } = useParams<{ eventId: string; clusterId: string }>();
  const [currentTab, setCurrentTab] = useState(0);

  const cluster = {
    name: 'North Region',
    leader: 'John Kamau',
    totalCollected: 250000,
    targetAmount: 300000,
    members: 25,
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Overview
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Collected
                  </Typography>
                  <Typography variant="h5">
                    KES {cluster.totalCollected.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Target Amount
                  </Typography>
                  <Typography variant="h5">
                    KES {cluster.targetAmount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Members
                  </Typography>
                  <Typography variant="h5">{cluster.members}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 1: // Daily Reports
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Daily Collection Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No daily reports yet
            </Typography>
          </Box>
        );

      case 2: // Members
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Cluster Members
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="No members added yet" />
              </ListItem>
            </List>
          </Box>
        );

      case 3: // Pledges
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Member Pledges
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No pledges recorded
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {cluster.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Led by {cluster.leader}
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Daily Reports" />
          <Tab label="Members" />
          <Tab label="Pledges" />
        </Tabs>
      </Paper>

      <Box>{renderTabContent()}</Box>
    </Box>
  );
};

export default ClusterDetailsPage;
