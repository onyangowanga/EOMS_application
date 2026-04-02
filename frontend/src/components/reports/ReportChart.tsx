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

  const total = data.reduce((sum, point) => sum + Number(point.value || 0), 0);
  const palette = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1'];

  let running = 0;
  const pieStops = data.map((point, idx) => {
    const value = Number(point.value || 0);
    const slice = total > 0 ? (value / total) * 100 : 0;
    const start = running;
    running += slice;
    const end = running;
    return `${palette[idx % palette.length]} ${start}% ${end}%`;
  }).join(', ');

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        {title}
      </Typography>

      <Box sx={{ height, bgcolor: 'background.default', borderRadius: 1, p: 2 }}>
        {(type === 'pie' || type === 'doughnut') ? (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
            <Box
              sx={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: `conic-gradient(${pieStops || '#e0e0e0 0% 100%'})`,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
            <Stack spacing={1} sx={{ minWidth: 220 }}>
              {data.slice(0, 8).map((point, idx) => (
                <Box key={`${point.label}-${idx}`} display="flex" justifyContent="space-between" gap={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: palette[idx % palette.length] }} />
                    <Typography variant="caption" color="text.secondary">{point.label}</Typography>
                  </Box>
                  <Typography variant="caption" fontWeight={600}>{point.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1.25} sx={{ height: '100%', justifyContent: 'center' }}>
            {data.slice(0, 10).map((point, idx) => {
              const value = Number(point.value || 0);
              const max = Math.max(...data.map((d) => Number(d.value || 0)), 1);
              const width = Math.max((value / max) * 100, 2);
              return (
                <Box key={`${point.label}-${idx}`}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">{point.label}</Typography>
                    <Typography variant="caption" fontWeight={600}>{point.value}</Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 8, borderRadius: 999, bgcolor: 'action.hover' }}>
                    <Box sx={{ width: `${width}%`, height: '100%', borderRadius: 999, bgcolor: palette[idx % palette.length] }} />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

export default ReportChart;
