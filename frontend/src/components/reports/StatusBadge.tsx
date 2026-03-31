import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  HourglassEmpty,
  Pause,
  Cancel,
  Info,
} from '@mui/icons-material';

type StatusType =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'CRITICAL'
  | 'COMPLETED'
  | 'PENDING'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | 'TODO'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PAID'
  | 'REJECTED'
  | 'APPROVED_CHAIR'
  | 'APPROVED_TREASURER'
  | 'APPROVED_FINANCE'
  | 'FULLY_APPROVED';

interface StatusBadgeProps extends Omit<ChipProps, 'color' | 'variant' | 'icon' | 'label'> {
  status?: string;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  label?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'filled',
  size = 'small',
  label,
  ...props
}) => {
  const statusConfig: Record<
    StatusType,
    {
      color: ChipProps['color'];
      icon: React.ReactNode;
      defaultLabel: string;
    }
  > = {
    ON_TRACK: {
      color: 'success',
      icon: <CheckCircle />,
      defaultLabel: 'On Track',
    },
    AT_RISK: {
      color: 'warning',
      icon: <Warning />,
      defaultLabel: 'At Risk',
    },
    CRITICAL: {
      color: 'error',
      icon: <Error />,
      defaultLabel: 'Critical',
    },
    COMPLETED: {
      color: 'success',
      icon: <CheckCircle />,
      defaultLabel: 'Completed',
    },
    IN_PROGRESS: {
      color: 'info',
      icon: <HourglassEmpty />,
      defaultLabel: 'In Progress',
    },
    PENDING: {
      color: 'warning',
      icon: <HourglassEmpty />,
      defaultLabel: 'Pending',
    },
    BLOCKED: {
      color: 'error',
      icon: <Pause />,
      defaultLabel: 'Blocked',
    },
    CANCELLED: {
      color: 'default',
      icon: <Cancel />,
      defaultLabel: 'Cancelled',
    },
    TODO: {
      color: 'default',
      icon: <HourglassEmpty />,
      defaultLabel: 'Not Started',
    },
    SUBMITTED: {
      color: 'info',
      icon: <HourglassEmpty />,
      defaultLabel: 'Submitted',
    },
    APPROVED: {
      color: 'success',
      icon: <CheckCircle />,
      defaultLabel: 'Approved',
    },
    PAID: {
      color: 'success',
      icon: <CheckCircle />,
      defaultLabel: 'Paid',
    },
    REJECTED: {
      color: 'error',
      icon: <Cancel />,
      defaultLabel: 'Rejected',
    },
    APPROVED_CHAIR: {
      color: 'warning',
      icon: <CheckCircle />,
      defaultLabel: 'Approved (Chair)',
    },
    APPROVED_TREASURER: {
      color: 'warning',
      icon: <CheckCircle />,
      defaultLabel: 'Approved (Treasurer)',
    },
    APPROVED_FINANCE: {
      color: 'warning',
      icon: <CheckCircle />,
      defaultLabel: 'Approved (Finance)',
    },
    FULLY_APPROVED: {
      color: 'success',
      icon: <CheckCircle />,
      defaultLabel: 'Fully Approved',
    },
  };

  const normalizedStatus = (status || '')
    .toString()
    .trim()
    .replace(/[-\s]+/g, '_')
    .toUpperCase() as StatusType;

  const config = statusConfig[normalizedStatus] || {
    color: 'default' as ChipProps['color'],
    icon: <Info />,
    defaultLabel: status || 'Unknown',
  };

  return (
    <Chip
      icon={config.icon as any}
      label={label || config.defaultLabel}
      color={config.color}
      variant={variant}
      size={size}
      {...props}
    />
  );
};

export default StatusBadge;
