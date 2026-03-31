import React from 'react';
import { Box, Grid, CircularProgress, Alert, Stack } from '@mui/material';
import ReportChart from './ReportChart';
import ReportTable from './ReportTable';
import type { TableColumn } from './ReportTable';
import StatusBadge from './StatusBadge';
import type { OperationsReportData, SubcommitteePerformance, TaskSummaryItem } from '../../types';

interface OperationsReportProps {
  data?: OperationsReportData;
  loading?: boolean;
  error?: string;
}

const OperationsReport: React.FC<OperationsReportProps> = ({
  data,
  loading = false,
  error,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data) {
    return <Alert severity="info">No data available</Alert>;
  }

  // Subcommittee Performance Columns
  const subcommitteeColumns: TableColumn<SubcommitteePerformance>[] = [
    {
      id: 'name',
      label: 'Subcommittee Name',
      sortable: true,
      minWidth: 200,
    },
    {
      id: 'total_tasks',
      label: 'Total Tasks',
      sortable: true,
      align: 'right',
    },
    {
      id: 'completed_tasks',
      label: 'Completed',
      sortable: true,
      align: 'right',
    },
    {
      id: 'blocked_tasks',
      label: 'Blocked',
      sortable: true,
      align: 'right',
    },
    {
      id: 'overdue_tasks',
      label: 'Overdue',
      sortable: true,
      align: 'right',
    },
    {
      id: 'progress_percentage',
      label: 'Progress',
      sortable: true,
      align: 'right',
      format: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      id: 'status',
      label: 'Status',
      format: (value) => <StatusBadge status={value} size="small" />,
    },
  ];

  // Task Breakdown Columns
  const taskColumns: TableColumn<TaskSummaryItem>[] = [
    {
      id: 'title',
      label: 'Task Title',
      sortable: true,
      minWidth: 250,
    },
    {
      id: 'subcommittee_name',
      label: 'Subcommittee',
      sortable: true,
    },
    {
      id: 'assigned_to',
      label: 'Assigned To',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      format: (value) => <StatusBadge status={value} size="small" />,
    },
    {
      id: 'progress_percentage',
      label: 'Progress',
      sortable: true,
      align: 'right',
      format: (value: number) => `${value}%`,
    },
  ];

  return (
    <Stack spacing={3}>
      {/* Operations Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Tasks by Status"
            type="pie"
            data={data.charts.tasks_by_status}
            height={300}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Subcommittee Progress Comparison"
            type="bar"
            data={data.charts.subcommittee_progress}
            height={300}
          />
        </Grid>
        <Grid item xs={12}>
          <ReportChart
            title="Tasks Over Time"
            type="line"
            data={data.charts.tasks_over_time}
            height={300}
          />
        </Grid>
      </Grid>

      {/* Subcommittee Performance Table */}
      <ReportTable
        title="Subcommittee Performance"
        columns={subcommitteeColumns}
        data={data.subcommittee_performance}
        searchFields={['name']}
        maxRows={10}
        striped
      />

      {/* Task Breakdown Table */}
      <ReportTable
        title="Task Breakdown"
        columns={taskColumns}
        data={data.task_breakdown}
        searchFields={['title', 'subcommittee_name', 'assigned_to']}
        maxRows={10}
        striped
      />
    </Stack>
  );
};

export default OperationsReport;
