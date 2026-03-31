import React from 'react';
import { Box, Grid, CircularProgress, Alert, Stack } from '@mui/material';
import ReportChart from './ReportChart';
import ReportTable from './ReportTable';
import type { TableColumn } from './ReportTable';
import type { MemberReportData, MemberActivityEntry } from '../../types';

interface MembersReportProps {
  data?: MemberReportData;
  loading?: boolean;
  error?: string;
}

const MembersReport: React.FC<MembersReportProps> = ({
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

  // Member Activity Columns
  const memberColumns: TableColumn<MemberActivityEntry>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      minWidth: 180,
    },
    {
      id: 'role',
      label: 'Role',
      sortable: true,
      format: (value) => value.replace(/_/g, ' '),
    },
    {
      id: 'tasks_assigned',
      label: 'Tasks Assigned',
      sortable: true,
      align: 'right',
    },
    {
      id: 'tasks_completed',
      label: 'Tasks Completed',
      sortable: true,
      align: 'right',
    },
    {
      id: 'completion_rate_percentage',
      label: 'Completion Rate',
      sortable: true,
      align: 'right',
      format: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      id: 'cluster_role',
      label: 'Cluster Role',
      format: (value?: string) => value?.replace(/_/g, ' ') || 'None',
    },
  ];

  return (
    <Stack spacing={3}>
      {/* Member Participation Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Member Participation Activity"
            type="line"
            data={data.charts.member_participation_activity}
            height={300}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Member Distribution by Committees"
            type="bar"
            data={data.charts.member_distribution_by_committees}
            height={300}
          />
        </Grid>
      </Grid>

      {/* Member Activity Table */}
      <ReportTable
        title="Member Activity"
        columns={memberColumns}
        data={data.member_activity}
        searchFields={['name', 'role']}
        maxRows={10}
        striped
      />
    </Stack>
  );
};

export default MembersReport;
