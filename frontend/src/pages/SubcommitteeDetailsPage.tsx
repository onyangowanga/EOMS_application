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
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { Assignment, Group, Assessment } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

/**
 * Subcommittee Details Page - Subcommittees Module
 * Shows overview, tasks, members, and reports for a specific subcommittee
 */
const SubcommitteeDetailsPage: React.FC = () => {
  const { eventId, subcommitteeId } = useParams<{
    eventId: string;
    subcommitteeId: string;
  }>();
  const [currentTab, setCurrentTab] = useState(0);

  const { data: subcommittee } = useQuery({
    queryKey: ['subcommittee', subcommitteeId],
    queryFn: async () => {
      // TODO: Implement actual API call
      return {
        id: subcommitteeId,
        name: 'Sample Subcommittee',
        description: 'This is a sample description',
        members: [],
        tasks: [],
      };
    },
    enabled: !!subcommitteeId,
  });

  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Overview
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {subcommittee?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subcommittee?.description}
            </Typography>
          </Box>
        );

      case 1: // Tasks
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No tasks yet
            </Typography>
          </Box>
        );

      case 2: // Members
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Members
            </Typography>
            <List>
              {subcommittee?.members?.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No members yet
                </Typography>
              )}
            </List>
          </Box>
        );

      case 3: // Reports
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No reports available
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
        Subcommittee Details
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Tasks" />
          <Tab label="Members" />
          <Tab label="Reports" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 3 }}>{renderTabContent()}</Paper>
    </Box>
  );
};

export default SubcommitteeDetailsPage;
