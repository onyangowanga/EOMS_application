import React from 'react';
import { Box, Grid, CircularProgress, Alert, Stack, Chip } from '@mui/material';
import KPICard from './KPICard';
import ReportChart from './ReportChart';
import ReportTable from './ReportTable';
import type { TableColumn } from './ReportTable';
import type { SummaryReportData, TaskSummaryItem } from '../../types';

interface SummaryReportProps {
  data?: SummaryReportData;
  loading?: boolean;
  error?: string;
}

const SummaryReport: React.FC<SummaryReportProps> = ({
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

  // KPI Card Grid
  const kpiColumns = Object.values(data.kpis).length;
  const kpiGridSize = Math.max(12 / kpiColumns, 3) as any;

  // Table columns for overdue tasks
  const overdueTasksColumns: TableColumn<TaskSummaryItem>[] = [
    {
      id: 'title',
      label: 'Task Title',
      sortable: true,
      minWidth: 200,
    },
    {
      id: 'subcommittee_name',
      label: 'Subcommittee',
      sortable: true,
    },
    {
      id: 'days_remaining',
      label: 'Days Overdue',
      sortable: true,
      align: 'right',
      format: (value: number | undefined) => (value && value < 0 ? Math.abs(value) : '-'),
    },
    {
      id: 'assigned_to',
      label: 'Assigned To',
      sortable: true,
    },
    {
      id: 'priority',
      label: 'Priority',
      format: (value: TaskSummaryItem['priority']) => (
        <Chip label={value} size="small" variant="outlined" />
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      {/* KPI Cards */}
      <Grid container spacing={2}>
        {Object.entries(data.kpis).map(([key, kpi]) => (
          <Grid item xs={12} sm={6} md={kpiGridSize} key={key}>
            <KPICard kpi={kpi} variant="expanded" />
          </Grid>
        ))}
      </Grid>

      {/* Summary Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Daily Collections"
            type="line"
            data={data.charts.daily_collections}
            height={300}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Expense Distribution"
            type="pie"
            data={data.charts.expense_distribution}
            height={300}
          />
        </Grid>
        <Grid item xs={12}>
          <ReportChart
            title="Subcommittee Progress"
            type="bar"
            data={data.charts.subcommittee_progress}
            height={300}
          />
        </Grid>
      </Grid>

      {/* Summary Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ReportTable
            title="Top 5 Overdue Tasks"
            columns={overdueTasksColumns}
            data={data.tables.overdue_tasks}
            maxRows={5}
            searchFields={['title', 'subcommittee_name']}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReportTable
            title="Latest Contributions"
            columns={[
              { id: 'source', label: 'Source', sortable: true },
              { id: 'amount', label: 'Amount', sortable: true, format: (v: string) => `${v}` },
              { id: 'date', label: 'Date', sortable: true },
              { id: 'cluster', label: 'Cluster', sortable: true },
            ] as TableColumn<any>[]}
            data={data.tables.latest_contributions}
            maxRows={5}
          />
        </Grid>
      </Grid>
    </Stack>
  );
};

export default SummaryReport;
