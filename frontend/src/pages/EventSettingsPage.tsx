import React, { useState } from 'react';
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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Save, Archive, Lock } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

/**
 * Event Settings Page - Admin Module
 * Manage event settings, archive, and finalization
 */
const EventSettingsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [formData, setFormData] = useState({
    eventName: 'Annual Fundraiser',
    eventType: 'FUNERAL',
    eventDate: '2026-04-15',
    location: 'Community Hall',
    description: 'Annual community fundraiser event',
    status: 'PLANNING',
  });
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);

  const handleSave = () => {
    // TODO: Implement save
    console.log('Saving event settings:', formData);
  };

  const handleArchive = () => {
    // TODO: Implement archive
    console.log('Archiving event');
    setArchiveDialogOpen(false);
  };

  const handleFinalize = () => {
    // TODO: Implement finalize
    console.log('Finalizing event');
    setFinalizeDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Event Settings
      </Typography>

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
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Event Type</InputLabel>
          <Select
            value={formData.eventType}
            label="Event Type"
            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
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
        />

        <TextField
          fullWidth
          label="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          multiline
          rows={3}
          sx={{ mb: 3 }}
        />

        <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
          Save Changes
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
          <Button onClick={handleArchive} color="primary">
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
          <Button onClick={handleFinalize} color="error">
            Finalize
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventSettingsPage;
