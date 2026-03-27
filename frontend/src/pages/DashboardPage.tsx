import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import {
  Group,
  Assignment,
  Business,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { committeeService } from '../services/committee.service';
import { taskService } from '../services/task.service';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: committees } = useQuery({
    queryKey: ['my-committees'],
    queryFn: committeeService.getMyCommittees,
  });

  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: taskService.getMyTasks,
  });

  const stats = [
    {
      title: 'My Committees',
      value: committees?.length || 0,
      icon: <Group sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'My Tasks',
      value: myTasks?.length || 0,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Pending Tasks',
      value: myTasks?.filter(t => t.status === 'PENDING').length || 0,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Active Committees',
      value: committees?.filter(c => c.status === 'ACTIVE').length || 0,
      icon: <Business sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.full_name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Here's an overview of your activities
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Committees
            </Typography>
            {committees && committees.length > 0 ? (
              <Box>
                {committees.slice(0, 5).map((committee) => (
                  <Box key={committee.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="body1">{committee.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {committee.event_type} - {new Date(committee.event_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No committees yet
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Tasks
            </Typography>
            {myTasks && myTasks.length > 0 ? (
              <Box>
                {myTasks.slice(0, 5).map((task) => (
                  <Box key={task.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="body1">{task.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.status} - Priority: {task.priority}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tasks assigned yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
