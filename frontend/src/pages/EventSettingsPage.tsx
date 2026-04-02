import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Save, Archive, Lock } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/event.service';
import type { Event } from '../types';

/**
 * Event Settings Page - Admin Module
 * Manage event settings, archive, and finalization
 */
const EventSettingsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'FUNERAL',
    eventDate: '',
    location: '',
    description: '',
    status: 'PLANNING',
  });
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['event', eventId, 'settings'],
    queryFn: () => eventService.getEvent(eventId!),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.event_name || '',
        eventType: event.event_type || 'FUNERAL',
        eventDate: event.event_date || '',
        location: event.location || '',
        description: event.description || '',
        status: event.status || 'PLANNING',
      });
    }
  }, [event]);

  const updateEventMutation = useMutation({
    mutationFn: (payload: any) => eventService.updateEvent(eventId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'settings'] });
      setErrorMessage('');
      setSuccessMessage('Event settings saved successfully.');
    },
    onError: (error: any) => {
      setSuccessMessage('');
      setErrorMessage(error?.response?.data?.error || 'Failed to update event settings');
    },
  });

  const handleSave = () => {
    if (!eventId) return;
    updateEventMutation.mutate({
      event_name: formData.eventName,
      event_type: formData.eventType,
      event_date: formData.eventDate,
      location: formData.location,
      description: formData.description,
      status: formData.status,
    });
  };

  const handleArchive = () => {
    if (!eventId) return;
    updateEventMutation.mutate({ status: 'CANCELLED' });
    setArchiveDialogOpen(false);
    setFormData((prev) => ({ ...prev, status: 'CANCELLED' }));
  };

  const handleFinalize = () => {
    if (!eventId) return;
    updateEventMutation.mutate({ status: 'COMPLETED' });
    setFinalizeDialogOpen(false);
    setFormData((prev) => ({ ...prev, status: 'COMPLETED' }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Event Settings
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 800, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Information
        </Typography>

        <TextField
          fullWidth
          label="Event Name"
          value={formData.eventName}
          onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
          sx={{ mb: 2 }}
          disabled={isLoading || updateEventMutation.isPending}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Event Type</InputLabel>
          <Select
            value={formData.eventType}
            label="Event Type"
            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
            disabled={isLoading || updateEventMutation.isPending}
          >
            <MenuItem value="FUNERAL">Funeral</MenuItem>
            <MenuItem value="WEDDING">Wedding</MenuItem>
            <MenuItem value="FUNDRAISER">Fundraiser</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Event Date"
          type="date"
          value={formData.eventDate}
          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          disabled={isLoading || updateEventMutation.isPending}
        />

        <TextField
          fullWidth
          label="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          sx={{ mb: 2 }}
          disabled={isLoading || updateEventMutation.isPending}
        />

        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          multiline
          rows={3}
          sx={{ mb: 3 }}
          disabled={isLoading || updateEventMutation.isPending}
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            label="Status"
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            disabled={isLoading || updateEventMutation.isPending}
          >
            <MenuItem value="PLANNING">Planning</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={isLoading || updateEventMutation.isPending}>
          {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 800 }}>
        <Typography variant="h6" gutterBottom>
          Event Actions
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          These actions are permanent and cannot be undone
        </Alert>

        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Archive />}
            onClick={() => setArchiveDialogOpen(true)}
          >
            Archive Event
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Lock />}
            onClick={() => setFinalizeDialogOpen(true)}
          >
            Finalize Event
          </Button>
        </Box>
      </Paper>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)}>
        <DialogTitle>Archive Event?</DialogTitle>
        <DialogContent>
          <Typography>
            Archiving this event will move it to archived events. You can restore it later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleArchive} color="primary" disabled={updateEventMutation.isPending}>
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      {/* Finalize Dialog */}
      <Dialog open={finalizeDialogOpen} onClose={() => setFinalizeDialogOpen(false)}>
        <DialogTitle>Finalize Event?</DialogTitle>
        <DialogContent>
          <Typography>
            Finalizing this event will lock all data and prevent further changes. This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFinalize} color="error" disabled={updateEventMutation.isPending}>
            Finalize
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventSettingsPage;
