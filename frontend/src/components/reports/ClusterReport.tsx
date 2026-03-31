import React from 'react';
import { Box, Grid, CircularProgress, Alert, Stack } from '@mui/material';
import ReportChart from './ReportChart';
import ReportTable from './ReportTable';
import type { TableColumn } from './ReportTable';
import type { ClusterReportData, ClusterReportEntry, CollectionLedgerEntry } from '../../types';

interface ClusterReportProps {
  data?: ClusterReportData;
  loading?: boolean;
  error?: string;
}

const ClusterReport: React.FC<ClusterReportProps> = ({
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

  // Cluster Overview Columns
  const clusterColumns: TableColumn<ClusterReportEntry>[] = [
    {
      id: 'name',
      label: 'Cluster Name',
      sortable: true,
      minWidth: 180,
    },
    {
      id: 'target_amount',
      label: 'Target Amount',
      sortable: true,
      align: 'right',
    },
    {
      id: 'collected_amount',
      label: 'Collected',
      sortable: true,
      align: 'right',
    },
    {
      id: 'pledged_amount',
      label: 'Pledged',
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
      id: 'lead_name',
      label: 'Lead',
      sortable: true,
    },
  ];

  // Collection Ledger Columns
  const collectionColumns: TableColumn<CollectionLedgerEntry>[] = [
    {
      id: 'donor_source',
      label: 'Donor / Source',
      sortable: true,
      minWidth: 200,
    },
    {
      id: 'cluster',
      label: 'Cluster',
      sortable: true,
    },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
    },
    {
      id: 'mode',
      label: 'Mode',
      sortable: true,
    },
    {
      id: 'date',
      label: 'Date',
      sortable: true,
    },
    {
      id: 'is_pledge',
      label: 'Pledge',
      format: (value: boolean) => (value ? 'Yes' : 'No'),
    },
    {
      id: 'submission_status',
      label: 'Submission Status',
      sortable: true,
    },
  ];

  return (
    <Stack spacing={3}>
      {/* Cluster Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Cluster Contribution"
            type="pie"
            data={data.charts.cluster_contribution}
            height={300}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Cluster Performance"
            type="bar"
            data={data.charts.cluster_performance}
            height={300}
          />
        </Grid>
      </Grid>

      {/* Cluster Tables */}
      <ReportTable
        title="Cluster Overview"
        columns={clusterColumns}
        data={data.cluster_overview}
        searchFields={['name', 'lead_name']}
        maxRows={10}
        striped
      />

      {/* Collection Ledger */}
      <ReportTable
        title="Collection Ledger"
        columns={collectionColumns}
        data={data.collection_ledger}
        searchFields={['donor_source', 'cluster']}
        maxRows={10}
        striped
      />
    </Stack>
  );
};

export default ClusterReport;
