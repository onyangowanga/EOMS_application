import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  BarChart as OperationsIcon,
  Assessment as SummaryIcon,
  AttachMoney as FinanceIcon,
  Groups as PeopleIcon,
  Store as ClusterIcon,
  Refresh as RefreshIcon,
  Settings,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/report.service';
import { eventService } from '../services/event.service';
import SummaryReport from '../components/reports/SummaryReport';
import OperationsReport from '../components/reports/OperationsReport';
import FinanceReport from '../components/reports/FinanceReport';
import ClusterReport from '../components/reports/ClusterReport';
import MembersReport from '../components/reports/MembersReport';
import ExportButtons from '../components/reports/ExportButtons';

// ============================================================================
// Tab Panel Component
// ============================================================================
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

// ============================================================================
// Main ReportsPage Component
// ============================================================================
const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [currentTab, setCurrentTab] = useState(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'custom'>('all');

  // =========================================================================
  // Queries
  // =========================================================================
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEvent(eventId!),
    enabled: !!eventId,
  });

  // Summary Report
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['report', eventId, 'summary', startDate, endDate],
    queryFn: () => reportService.getEventSummaryReport(eventId!, startDate, endDate),
    enabled: !!eventId,
  });

  // Operations Report
  const { data: operationsData, isLoading: operationsLoading, error: operationsError } = useQuery({
    queryKey: ['report', eventId, 'operations', startDate, endDate],
    queryFn: () => reportService.getEventOperationsReport(eventId!, startDate, endDate),
    enabled: !!eventId,
  });

  // Finance Report
  const { data: financeData, isLoading: financeLoading, error: financeError } = useQuery({
    queryKey: ['report', eventId, 'finance', startDate, endDate],
    queryFn: () => reportService.getEventFinanceReport(eventId!, startDate, endDate),
    enabled: !!eventId,
  });

  // Cluster Report
  const { data: clusterData, isLoading: clusterLoading, error: clusterError } = useQuery({
    queryKey: ['report', eventId, 'clusters', startDate, endDate],
    queryFn: () => reportService.getEventClusterReport(eventId!, startDate, endDate),
    enabled: !!eventId,
  });

  // Member Report
  const { data: memberData, isLoading: memberLoading, error: memberError } = useQuery({
    queryKey: ['report', eventId, 'members', startDate, endDate],
    queryFn: () => reportService.getEventMemberReport(eventId!, startDate, endDate),
    enabled: !!eventId,
  });

  // =========================================================================
  // Handlers
  // =========================================================================
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleDateRangeChange = (range: typeof dateRange) => {
    setDateRange(range);
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    switch (range) {
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'custom':
        return;
      default:
        start = '';
        end = '';
    }

    setStartDate(start);
    setEndDate(end);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['report', eventId] });
  };

  const handleExport = async (format: 'pdf' | 'xlsx' | 'csv') => {
    const reportTypes = [
      'summary',
      'operations',
      'finance',
      'clusters',
      'members',
    ] as const;
    const reportType = reportTypes[currentTab];

    try {
      const blob = await reportService.exportReport(
        eventId!,
        reportType,
        format,
        startDate,
        endDate
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event?.event_name ?? 'event'}-${reportType}-report.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error; // Let ExportButtons handle the error toast
    }
  };

  // =========================================================================
  // Render
  // =========================================================================
  if (eventLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Alert severity="error">
        Event not found. <Button onClick={() => navigate('/')}>Go to Home</Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Reports & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {event.event_name}
            </Typography>
          </Box>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              color="inherit"
            >
              Refresh
            </Button>
            <Button
              startIcon={<Settings />}
              onClick={() => navigate(`/admin/events/${eventId}/settings`)}
              variant="outlined"
            >
              {!isMobile && 'Settings'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          alignItems={isMobile ? 'stretch' : 'center'}
        >
          <FormControl sx={{ minWidth: isMobile ? '100%' : 200 }}>
            <InputLabel>Date Range</InputLabel>
            <Select value={dateRange} onChange={(e) => handleDateRangeChange(e.target.value as any)} label="Date Range">
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>

          {dateRange === 'custom' && (
            <>
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ minWidth: 200 }}
              />
              <TextField
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{ minWidth: 200 }}
              />
            </>
          )}

          <Box sx={{ flex: 1 }} />

          <ExportButtons
            onExport={handleExport}
            reportName={event.event_name}
            showLabels={!isMobile}
            size="small"
          />
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          allowScrollButtonsMobile
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tab icon={<SummaryIcon />} label="Summary" iconPosition="start" />
          <Tab icon={<OperationsIcon />} label="Operations" iconPosition="start" />
          <Tab icon={<FinanceIcon />} label="Finance" iconPosition="start" />
          <Tab icon={<ClusterIcon />} label="Clusters" iconPosition="start" />
          <Tab icon={<PeopleIcon />} label="Members" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        <SummaryReport
          data={summaryData}
          loading={summaryLoading}
          error={summaryError instanceof Error ? summaryError.message : undefined}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <OperationsReport
          data={operationsData}
          loading={operationsLoading}
          error={operationsError instanceof Error ? operationsError.message : undefined}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <FinanceReport
          data={financeData}
          loading={financeLoading}
          error={financeError instanceof Error ? financeError.message : undefined}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <ClusterReport
          data={clusterData}
          loading={clusterLoading}
          error={clusterError instanceof Error ? clusterError.message : undefined}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={4}>
        <MembersReport
          data={memberData}
          loading={memberLoading}
          error={memberError instanceof Error ? memberError.message : undefined}
        />
      </TabPanel>
    </Box>
  );
};

export default ReportsPage;
