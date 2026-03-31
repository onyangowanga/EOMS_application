import React from 'react';
import { Box, Grid, CircularProgress, Alert, Stack, Typography } from '@mui/material';
import KPICard from './KPICard';
import ReportChart from './ReportChart';
import ReportTable from './ReportTable';
import type { TableColumn } from './ReportTable';
import StatusBadge from './StatusBadge';
import type { FinanceReportData, IncomeLedgerEntry, ExpenseLedgerEntry } from '../../types';

interface FinanceReportProps {
  data?: FinanceReportData;
  loading?: boolean;
  error?: string;
}

const FinanceReport: React.FC<FinanceReportProps> = ({
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

  // Budget Overview KPI
  const budgetKPIs = [
    {
      label: 'Total Estimated Budget',
      value: data.budget_overview.total_estimated_budget,
      color: 'primary',
    },
    {
      label: 'Approved Budget',
      value: data.budget_overview.approved_budget,
      color: 'success',
    },
    {
      label: 'Used Budget (Paid)',
      value: data.budget_overview.used_budget_paid,
      color: 'warning',
    },
    {
      label: 'Remaining Budget',
      value: data.budget_overview.remaining_budget,
      color: 'info',
    },
  ];

  // Income Ledger Columns
  const incomeColumns: TableColumn<IncomeLedgerEntry>[] = [
    {
      id: 'source',
      label: 'Source',
      sortable: true,
      minWidth: 180,
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
      id: 'date',
      label: 'Date',
      sortable: true,
    },
    {
      id: 'type',
      label: 'Type',
      format: (value) => <StatusBadge status={value} size="small" />,
    },
    {
      id: 'submission_status',
      label: 'Submission',
      format: (value) => (value === 'SUBMITTED' ? 'Submitted' : 'Pending'),
    },
  ];

  // Expense Ledger Columns
  const expenseColumns: TableColumn<ExpenseLedgerEntry>[] = [
    {
      id: 'budget_item',
      label: 'Budget Item',
      sortable: true,
      minWidth: 200,
    },
    {
      id: 'subcommittee',
      label: 'Subcommittee',
      sortable: true,
    },
    {
      id: 'amount_approved',
      label: 'Approved',
      sortable: true,
      align: 'right',
    },
    {
      id: 'amount_paid',
      label: 'Paid',
      sortable: true,
      align: 'right',
    },
    {
      id: 'date_paid',
      label: 'Date Paid',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      format: (value) => <StatusBadge status={value} size="small" />,
    },
  ];

  return (
    <Stack spacing={3}>
      {/* Budget Overview KPIs */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Budget Overview
        </Typography>
        <Grid container spacing={2}>
          {budgetKPIs.map((kpi, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <KPICard kpi={kpi as any} variant="compact" />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Finance Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Income vs. Expense"
            type="line"
            data={data.charts.income_vs_expense}
            height={300}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReportChart
            title="Budget vs. Actual"
            type="pie"
            data={data.charts.budget_vs_actual}
            height={300}
          />
        </Grid>
        <Grid item xs={12}>
          <ReportChart
            title="Committee Budget Utilization"
            type="bar"
            data={data.charts.committee_budget_utilization}
            height={300}
          />
        </Grid>
      </Grid>

      {/* Ledgers */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ReportTable
            title="Income Ledger"
            columns={incomeColumns}
            data={data.income_ledger}
            searchFields={['source', 'cluster']}
            maxRows={10}
            striped
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReportTable
            title="Expense Ledger"
            columns={expenseColumns}
            data={data.expense_ledger}
            searchFields={['budget_item', 'subcommittee']}
            maxRows={10}
            striped
          />
        </Grid>
      </Grid>
    </Stack>
  );
};

export default FinanceReport;
