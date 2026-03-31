import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Stack,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import { committeeService } from '../services/committee.service';
import type { Task, TaskCreate, Committee } from '../types/index';
import ResponsiveDataView from '../components/ResponsiveDataView';

const TasksPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [formData, setFormData] = useState<Partial<TaskCreate>>({
    title: '',
    description: '',
    committee_id: undefined,
    assigned_to_id: undefined,
    priority: 'MEDIUM',
    estimated_cost: undefined,
    deadline: '',
  });
  const [error, setError] = useState('');

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getAll(),
  });

  // Fetch committees for dropdown
  const { data: committees } = useQuery({
    queryKey: ['committees'],
    queryFn: committeeService.getAll,
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create task');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      committee_id: undefined,
      assigned_to_id: undefined,
      priority: 'MEDIUM',
      estimated_cost: undefined,
      deadline: '',
    });
    setError('');
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.committee_id) {
      setError('Please fill in all required fields');
      return;
    }

    createMutation.mutate(formData as TaskCreate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  // Filter tasks
  const filteredTasks = tasks?.filter((task: Task) => {
    const statusMatch = filterStatus === 'ALL' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'ALL' || task.priority === filterPriority;
    const committeeMatch = selectedCommittee === '' || task.committee.id === selectedCommittee;
    return statusMatch && priorityMatch && committeeMatch;
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4">Tasks</Typography>
          <Typography variant="body1" color="text.secondary">
            Desktop keeps the full planning table. Mobile switches to actionable task cards.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          fullWidth={isMobile}
        >
          Create Task
        </Button>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: { xs: 2, md: 2.5 }, mb: 3, borderRadius: 5 }}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }} gap={2}>
          <FormControl fullWidth>
            <InputLabel>Committee</InputLabel>
            <Select
              value={selectedCommittee}
              onChange={(e) => setSelectedCommittee(e.target.value as number | '')}
              label="Committee"
            >
              <MenuItem value="">All Committees</MenuItem>
              {committees?.map((committee) => (
                <MenuItem key={committee.id} value={committee.id}>
                  {committee.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              label="Priority"
            >
              <MenuItem value="ALL">All Priorities</MenuItem>
              <MenuItem value="URGENT">Urgent</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <ResponsiveDataView
        data={filteredTasks || []}
        getRowId={(task) => task.id}
        emptyMessage="No tasks found"
        tableAriaLabel="Tasks"
        columns={[
          { key: 'title', label: 'Title', render: (task) => task.title },
          { key: 'committee', label: 'Committee', render: (task) => task.committee.name },
          { key: 'assigned', label: 'Assigned To', render: (task) => task.assigned_to ? task.assigned_to.full_name : 'Unassigned' },
          {
            key: 'status',
            label: 'Status',
            render: (task) => <Chip label={task.status} color={getStatusColor(task.status)} size="small" />,
          },
          {
            key: 'priority',
            label: 'Priority',
            render: (task) => <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" />,
          },
          {
            key: 'cost',
            label: 'Estimated Cost',
            render: (task) => task.estimated_cost ? `KES ${Number(task.estimated_cost).toLocaleString()}` : 'N/A',
            align: 'right',
          },
          {
            key: 'deadline',
            label: 'Deadline',
            render: (task) => task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline',
          },
          {
            key: 'created',
            label: 'Created',
            render: (task) => new Date(task.created_at).toLocaleDateString(),
          },
        ]}
        mobileTitle={(task) => task.title}
        mobileSubtitle={(task) => task.committee.name}
        mobileFields={[
          { label: 'Assigned', render: (task) => task.assigned_to ? task.assigned_to.full_name : 'Unassigned' },
          { label: 'Deadline', render: (task) => task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline' },
          { label: 'Status', render: (task) => <Chip label={task.status} color={getStatusColor(task.status)} size="small" /> },
          { label: 'Priority', render: (task) => <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" /> },
          { label: 'Est. Cost', render: (task) => task.estimated_cost ? `KES ${Number(task.estimated_cost).toLocaleString()}` : 'N/A' },
          { label: 'Created', render: (task) => new Date(task.created_at).toLocaleDateString() },
        ]}
        rowActions={() => (
          <Box display="flex" justifyContent="flex-end" gap={0.5}>
            <IconButton size="small" color="primary">
              <VisibilityIcon />
            </IconButton>
            <IconButton size="small" color="secondary">
              <EditIcon />
            </IconButton>
          </Box>
        )}
      />

      {/* Create Task Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Task Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              required
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControl fullWidth required>
              <InputLabel>Committee</InputLabel>
              <Select
                value={formData.committee_id || ''}
                onChange={(e) => setFormData({ ...formData, committee_id: Number(e.target.value) })}
                label="Committee"
              >
                {committees?.map((committee: Committee) => (
                  <MenuItem key={committee.id} value={committee.id}>
                    {committee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                label="Priority"
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Estimated Cost (Optional)"
              type="number"
              fullWidth
              inputProps={{ min: 0, step: '0.01' }}
              value={formData.estimated_cost ?? ''}
              onChange={(e) => setFormData({
                ...formData,
                estimated_cost: e.target.value ? Number(e.target.value) : undefined,
              })}
              helperText="If provided, a budget item will be created automatically."
            />
            <TextField
              label="Deadline"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksPage;
