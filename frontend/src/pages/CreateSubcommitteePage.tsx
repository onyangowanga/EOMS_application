import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/event.service';

/**
 * Create Subcommittee Page - Subcommittees Module
 * Form to create a new subcommittee for an event
 */
const CreateSubcommitteePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const resolvedEventId = React.useMemo(() => {
    if (eventId) return eventId;
    const match = location.pathname.match(/\/events\/([^/]+)/);
    return match?.[1] || null;
  }, [eventId, location.pathname]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [validationError, setValidationError] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!resolvedEventId) {
        throw new Error('Event ID is missing');
      }

      // Helps troubleshoot client/backend payload mismatch in browser console.
      console.log('Submitting subcommittee payload', {
        event: Number(resolvedEventId),
        name: data.name,
        description: data.description,
      });

      return eventService.createSubcommittee({
        event: String(Number(resolvedEventId)),
        name: data.name,
        description: data.description,
        committee_type: 'OTHER',
        is_main: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees', resolvedEventId] });
      navigate(`/events/${resolvedEventId}/subcommittees`);
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      setValidationError('Subcommittee name is required');
      return;
    }
    setValidationError('');
    createMutation.mutate(formData);
  };

  if (!resolvedEventId) {
    return (
      <Box>
        <Alert severity="error">Event context is missing. Please open this page from an event dashboard.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create Subcommittee
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Box>
          <TextField
            fullWidth
            label="Subcommittee Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            error={!!validationError}
            helperText={validationError || ''}
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={4}
            sx={{ mb: 3 }}
          />

          {createMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to create subcommittee: {(() => {
                const err: any = createMutation.error;
                return err?.response?.data?.error || err?.response?.data?.detail || err?.message || 'Unknown error';
              })()}
            </Alert>
          )}

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              Create Subcommittee
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(`/events/${resolvedEventId}/subcommittees`)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateSubcommitteePage;
