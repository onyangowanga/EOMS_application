import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
} from '@mui/icons-material';
import type { KPIData } from '../../types';

interface KPICardProps {
  kpi: KPIData;
  variant?: 'compact' | 'expanded';
}

const KPICard: React.FC<KPICardProps> = ({ kpi, variant = 'expanded' }) => {
  const theme = useTheme();

  const getColorValue = (color?: string) => {
    switch (color) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return null;
    return trend > 0 ? (
      <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />
    ) : (
      <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />
    );
  };

  const getTrendColor = (trend?: number) => {
    if (!trend) return 'default';
    return trend > 0 ? 'success' : 'error';
  };

  if (variant === 'compact') {
    return (
      <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {kpi.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {kpi.value}
            </Typography>
            {kpi.unit && (
              <Typography variant="body2" color="text.secondary">
                {kpi.unit}
              </Typography>
            )}
          </Box>
          {kpi.trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getTrendIcon(kpi.trend)}
              <Chip
                label={`${kpi.trend > 0 ? '+' : ''}${kpi.trend}%`}
                size="small"
                color={getTrendColor(kpi.trend) as any}
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${getColorValue(kpi.color)}15 0%, transparent 100%)`,
        border: `2px solid ${getColorValue(kpi.color)}30`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <CardContent sx={{ pb: 3 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {kpi.label}
            </Typography>
            <Info sx={{ fontSize: 18, color: 'text.secondary', opacity: 0.6 }} />
          </Box>

          {/* Main Value */}
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: getColorValue(kpi.color),
              }}
            >
              {kpi.value}
            </Typography>
            {kpi.unit && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, fontWeight: 500 }}
              >
                {kpi.unit}
              </Typography>
            )}
          </Box>

          {/* Trend */}
          {kpi.trend !== undefined && (
            <Stack direction="row" spacing={1} alignItems="center">
              {getTrendIcon(kpi.trend)}
              <Chip
                label={`${kpi.trend > 0 ? '+' : ''}${kpi.trend}% from last period`}
                size="small"
                color={getTrendColor(kpi.trend) as any}
                variant="outlined"
              />
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default KPICard;
