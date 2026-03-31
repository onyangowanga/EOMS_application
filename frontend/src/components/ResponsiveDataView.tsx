import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type Align = 'left' | 'center' | 'right' | 'inherit' | 'justify';

export interface ResponsiveColumn<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  align?: Align;
  width?: number | string;
}

export interface ResponsiveField<T> {
  label: string;
  render: (item: T) => React.ReactNode;
}

interface ResponsiveDataViewProps<T> {
  data: T[];
  columns: ResponsiveColumn<T>[];
  mobileTitle: (item: T) => React.ReactNode;
  mobileSubtitle?: (item: T) => React.ReactNode;
  mobileFields: ResponsiveField<T>[];
  mobileFooter?: (item: T) => React.ReactNode;
  rowActions?: (item: T) => React.ReactNode;
  getRowId: (item: T) => string | number;
  emptyMessage: string;
  tableAriaLabel?: string;
  minWidth?: number;
}

function ResponsiveDataView<T>({
  data,
  columns,
  mobileTitle,
  mobileSubtitle,
  mobileFields,
  mobileFooter,
  rowActions,
  getRowId,
  emptyMessage,
  tableAriaLabel,
  minWidth = 760,
}: ResponsiveDataViewProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!data.length) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 2,
          backgroundColor: alpha('#ffffff', 0.72),
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  if (isMobile) {
    return (
      <Grid container spacing={2}>
        {data.map((item) => (
          <Grid item xs={12} sm={6} key={getRowId(item)}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(242,250,255,0.98) 100%)',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontSize: '0.95rem', lineHeight: 1.2 }} noWrap>
                      {mobileTitle(item)}
                    </Typography>
                    {mobileSubtitle && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {mobileSubtitle(item)}
                      </Typography>
                    )}
                  </Box>
                  {rowActions && <Box sx={{ flexShrink: 0 }}>{rowActions(item)}</Box>}
                </Stack>

                <Box
                  sx={{
                    mt: 2,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 1.5,
                  }}
                >
                  {mobileFields.map((field) => (
                    <Box key={field.label}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mb: 0.4,
                          color: 'text.secondary',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {field.label}
                      </Typography>
                      <Typography component="div" variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {field.render(item)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {mobileFooter && <Box sx={{ mt: 2 }}>{mobileFooter(item)}</Box>}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <TableContainer component={Paper} aria-label={tableAriaLabel}>
      <Table sx={{ minWidth }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align} sx={{ width: column.width }}>
                {column.label}
              </TableCell>
            ))}
            {rowActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={getRowId(item)}
              hover
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align}>
                  {column.render(item)}
                </TableCell>
              ))}
              {rowActions && <TableCell align="right">{rowActions(item)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ResponsiveDataView;