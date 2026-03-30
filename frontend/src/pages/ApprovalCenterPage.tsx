import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
} from '@mui/material';
import { CheckCircle, Pending, AttachMoney, People } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

/**
 * Approval Center Page - Approvals Module
 * Centralized page for all pending approvals:
 * - Budget Approvals
 * - Requisition Approvals
 * - Payment Approvals
 * - Cluster Fund Submissions
 */
const ApprovalCenterPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [currentTab, setCurrentTab] = useState(0);

  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Budget Approvals
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Pending Budget Approvals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No pending budget approvals
            </Typography>
          </Box>
        );

      case 1: // Requisitions
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Pending Requisitions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No pending requisitions
            </Typography>
          </Box>
        );

      case 2: // Payments
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Pending Payments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No pending payments
            </Typography>
          </Box>
        );

      case 3: // Cluster Submissions
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Pending Cluster Fund Submissions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No pending submissions
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
        Approval Center
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Pending Approvals
              </Typography>
              <Typography variant="h4">0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Approved Today
              </Typography>
              <Typography variant="h4">0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
              <Typography variant="h4">0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total This Month
              </Typography>
              <Typography variant="h4">0</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Budget" />
          <Tab label="Requisitions" />
          <Tab label="Payments" />
          <Tab label="Cluster Funds" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper sx={{ p: 3 }}>{renderTabContent()}</Paper>
    </Box>
  );
};

export default ApprovalCenterPage;
