import React, { useState } from 'react';
import {
  Button,
  Stack,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as PDFIcon,
  TableChart as ExcelIcon,
  DataObject as JSONIcon,
} from '@mui/icons-material';

type ExportFormat = 'pdf' | 'xlsx' | 'csv';

interface ExportButtonsProps {
  onExport: (format: ExportFormat) => Promise<void>;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  reportName?: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExport,
  disabled = false,
  variant = 'outlined',
  size = 'medium',
  orientation = 'horizontal',
  showLabels = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      setError(null);
      setLoading(true);
      await onExport(format);
      handleMenuClose();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const ExportOption = ({
    format,
    label,
    icon: Icon,
  }: {
    format: ExportFormat;
    label: string;
    icon: React.ComponentType<any>;
  }) => (
    <Button
      startIcon={<Icon />}
      onClick={() => handleExport(format)}
      disabled={disabled || loading}
      variant={variant}
      size={size}
      sx={{ gap: 1 }}
    >
      {showLabels && label}
    </Button>
  );

  // Compact menu-based export
  if (orientation === 'vertical' || !showLabels) {
    return (
      <>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box>
          <Button
            id="export-button"
            onClick={handleMenuOpen}
            startIcon={
              loading ? (
                <CircularProgress size={20} />
              ) : (
                <DownloadIcon />
              )
            }
            disabled={disabled || loading}
            variant={variant}
            size={size}
          >
            {showLabels ? 'Export' : undefined}
          </Button>
          <Menu
            id="export-menu"
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleExport('pdf')}>
              <PDFIcon sx={{ mr: 1 }} /> PDF
            </MenuItem>
            <MenuItem onClick={() => handleExport('xlsx')}>
              <ExcelIcon sx={{ mr: 1 }} /> Excel (.xlsx)
            </MenuItem>
            <MenuItem onClick={() => handleExport('csv')}>
              <JSONIcon sx={{ mr: 1 }} /> CSV
            </MenuItem>
          </Menu>
        </Box>
      </>
    );
  }

  // Full button layout
  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack
        direction={orientation === 'horizontal' ? 'row' : 'column'}
        spacing={1}
      >
        <ExportOption
          format="pdf"
          label="PDF"
          icon={PDFIcon}
        />
        <ExportOption
          format="xlsx"
          label="Excel"
          icon={ExcelIcon}
        />
        <ExportOption
          format="csv"
          label="CSV"
          icon={JSONIcon}
        />
      </Stack>
    </>
  );
};

export default ExportButtons;
