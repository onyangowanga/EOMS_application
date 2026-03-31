import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  TextField,
  Stack,
  Chip,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

export interface TableColumn<T> {
  id: keyof T;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => React.ReactNode;
  width?: string | number;
  minWidth?: string | number;
}

interface ReportTableProps<T> {
  title: string;
  columns: TableColumn<T>[];
  data: T[];
  searchable?: boolean;
  searchFields?: (keyof T)[];
  maxRows?: number;
  dense?: boolean;
  striped?: boolean;
}

function ReportTable<T extends Record<string, any>>({
  title,
  columns,
  data,
  searchable = true,
  searchFields = [],
  maxRows = 10,
  dense = false,
  striped = true,
}: ReportTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof T | null>(null);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery || searchFields.length === 0) return data;

    return data.filter((row) =>
      searchFields.some((field) => {
        const value = row[field];
        return value
          ?.toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      })
    );
  }, [data, searchQuery, searchFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, order, orderBy]);

  // Paginate data
  const displayedData = useMemo(() => {
    return sortedData.slice(0, maxRows);
  }, [sortedData, maxRows]);

  const handleSort = (columnId: keyof T) => {
    if (!columns.find((col) => col.id === columnId)?.sortable) return;

    if (orderBy === columnId) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(columnId);
      setOrder('asc');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip
            label={`${filteredData.length} items`}
            variant="outlined"
            size="small"
          />
        </Stack>

        {/* Search */}
        {searchable && searchFields.length > 0 && (
          <TextField
            placeholder="Search..."
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ maxWidth: 300 }}
          />
        )}
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 'auto' }}>
        <Table
          size={dense ? 'small' : 'medium'}
          stickyHeader
          sx={{
            '& tbody tr': {
              bgcolor: striped ? 'background.paper' : 'transparent',
              '&:nth-of-type(odd)': striped
                ? { bgcolor: 'action.hover' }
                : undefined,
              '&:hover': {
                bgcolor: 'action.selected',
              },
            },
          }}
        >
          {/* Header */}
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100', borderBottom: '2px solid', borderColor: 'divider' }}>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  sx={{
                    width: column.width,
                    minWidth: column.minWidth || 120,
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* Body */}
          <TableBody>
            {displayedData.length > 0 ? (
              displayedData.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.id)}
                      align={column.align || 'left'}
                      sx={{ py: dense ? 1 : 2 }}
                    >
                      {column.format
                        ? column.format(row[column.id])
                        : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography color="text.secondary">
                    {searchQuery ? 'No results found' : 'No data available'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      {sortedData.length > maxRows && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2 }}
        >
          Showing {displayedData.length} of {sortedData.length} items
        </Typography>
      )}
    </Paper>
  );
}

export default ReportTable;
