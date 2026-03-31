import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import type { ChartDataPoint } from '../../types';

type ChartType = 'line' | 'bar' | 'pie' | 'doughnut';

interface ReportChartProps {
  title: string;
  type: ChartType;
  data: ChartDataPoint[];
  height?: number;
  loading?: boolean;
  error?: string;
  isEmpty?: boolean;
}

/**
 * ReportChart Component
 * 
 * Flexible chart component that supports multiple chart types.
 * Chart rendering is delegated to client-side charting library (e.g., Chart.js, Recharts)
 * 
 * Usage:
 * - Pass data in format: [{ label: 'Jan', value: 100 }, { label: 'Feb', value: 200 }]
 * - Specify chart type: 'line', 'bar', 'pie', 'doughnut'
 * - Title is displayed above the chart
 */
const ReportChart: React.FC<ReportChartProps> = ({
  title,
  type,
  data,
  height = 300,
  loading = false,
  error,
  isEmpty = false,
}) => {
  if (loading) {
    return (
      <Paper sx={{ p: 3, height }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading chart...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height, bgcolor: 'error.50' }}>
        <Stack spacing={1} sx={{ height: '100%', justifyContent: 'center' }}>
          <Info color="error" />
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (isEmpty || !data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, height }}>
        <Stack spacing={1} sx={{ height: '100%', justifyContent: 'center' }}>
          <Info color="info" />
          <Typography variant="body2" color="text.secondary">
            No data available for this chart
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        {title}
      </Typography>

      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          borderRadius: 1,
          position: 'relative',
        }}
      >
        {/* Placeholder for actual chart rendering */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {type.charAt(0).toUpperCase() + type.slice(1)} Chart
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Data points: {data.length}
          </Typography>

          {/* Data Summary */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              width: '100%',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {data.slice(0, 5).map((point, idx) => (
              <Box key={idx} sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {point.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {point.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 2 }}
      >
        Note: For production, integrate with Chart.js, Recharts, or your preferred charting library.
        This component provides the data structure and styling framework.
      </Typography>
    </Paper>
  );
};

export default ReportChart;
