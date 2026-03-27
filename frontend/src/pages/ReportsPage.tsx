import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/report.service';
import { committeeService } from '../services/committee.service';

const ReportsPage: React.FC = () => {
  const [selectedCommittee, setSelectedCommittee] = useState<number | ''>('');
  const [currentTab, setCurrentTab] = useState(0);

  const { data: committees } = useQuery({
    queryKey: ['committees'],
    queryFn: committeeService.getAll,
  });

  const { data: committeeReport, isLoading: reportLoading } = useQuery({
    queryKey: ['committee-report', selectedCommittee],
    queryFn: () => reportService.getCommitteeReport(selectedCommittee as number),
    enabled: !!selectedCommittee,
  });

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(numAmount);
  };

  const calculateBalance = (collections: string, expenses: string) => {
    const collectionsNum = parseFloat(collections || '0');
    const expensesNum = parseFloat(expenses || '0');
    return collectionsNum - expensesNum;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />}>
          Export PDF
        </Button>
      </Box>

      {/* Committee Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Select Committee</InputLabel>
          <Select
            value={selectedCommittee}
            onChange={(e) => setSelectedCommittee(e.target.value as number | '')}
            label="Select Committee"
          >
            <MenuItem value="">All Committees</MenuItem>
            {committees?.map((committee) => (
              <MenuItem key={committee.id} value={committee.id}>
                {committee.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedCommittee && (
        <>
          {reportLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : committeeReport ? (
            <>
              {/* Summary Cards */}
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Total Members
                      </Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {committeeReport.total_members}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Total Tasks
                      </Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {committeeReport.total_tasks}
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        {committeeReport.completed_tasks} completed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Collections
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        {formatCurrency(committeeReport.total_collections)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Expenses
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        {formatCurrency(committeeReport.total_expenses)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Report Tabs */}
              <Paper sx={{ mb: 2 }}>
                <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                  <Tab label="Financial Summary" />
                  <Tab label="Tasks Overview" />
                  <Tab label="Members" />
                </Tabs>
              </Paper>

              {/* Financial Tab */}
              {currentTab === 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Financial Summary
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Collections:
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {formatCurrency(committeeReport.total_collections)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Expenses:
                      </Typography>
                      <Typography variant="h5" color="error.main">
                        {formatCurrency(committeeReport.total_expenses)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Balance:
                      </Typography>
                      <Typography
                        variant="h4"
                        color={
                          calculateBalance(
                            committeeReport.total_collections,
                            committeeReport.total_expenses
                          ) >= 0
                            ? 'success.main'
                            : 'error.main'
                        }
                      >
                        {formatCurrency(
                          calculateBalance(
                            committeeReport.total_collections,
                            committeeReport.total_expenses
                          )
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Tasks Tab */}
              {currentTab === 1 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Tasks Overview
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Tasks:
                      </Typography>
                      <Typography variant="h4">{committeeReport.total_tasks}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Completed:
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {committeeReport.completed_tasks}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Pending:
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {committeeReport.pending_tasks}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Completion Rate:
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {committeeReport.total_tasks > 0
                          ? Math.round(
                              (committeeReport.completed_tasks / committeeReport.total_tasks) * 100
                            )
                          : 0}
                        %
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Members Tab */}
              {currentTab === 2 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Committee Members
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 2 }}>
                    {committeeReport.total_members} Members
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Detailed member list and roles
                  </Typography>
                </Paper>
              )}
            </>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography color="text.secondary">No data available for this committee</Typography>
            </Paper>
          )}
        </>
      )}

      {!selectedCommittee && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Please select a committee to view its report
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ReportsPage;
