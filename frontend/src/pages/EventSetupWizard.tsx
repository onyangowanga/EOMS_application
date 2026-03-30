import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { CheckCircle, Event as EventIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/event.service';
import type { EventCreate } from '../types';

/**
 * Event Setup Wizard - Single Event System
 * 
 * 3-step wizard for the event owner to create the main event and executive committee.
 * 
 * Steps:
 * 1. Event Details - Basic event information
 * 2. Executive Committee - Add Chairman, Treasurer, Secretary details
 * 3. Review & Create - Confirm and create event + committee members
 */
const EventSetupWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [eventData, setEventData] = useState<EventCreate>({
    event_name: '',
    event_type: 'FUNERAL',
    event_date: '',
    location: '',
    description: '',
  });
  const [committeeData, setCommitteeData] = useState({
    chairman: { full_name: '', phone: '', email: '' },
    treasurer: { full_name: '', phone: '', email: '' },
    secretary: { full_name: '', phone: '', email: '' },
  });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...eventData,
        committee_members: committeeData,
      };

      return eventService.createEventWithCommittee(payload);
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      setCreatedEventId(event.id);
      setShowSuccessDialog(true);
    },
  });

  const steps = ['Event Details', 'Executive Committee', 'Review & Create'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCreateEvent = () => {
    createEventMutation.mutate();
  };

  const handleGoToDashboard = () => {
    navigate(`/events/${createdEventId}/dashboard`);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(
          eventData.event_name &&
          eventData.event_type &&
          eventData.event_date &&
          eventData.location
        );
      case 1:
        // At least Chairman is required
        return !!(
          committeeData.chairman.full_name &&
          committeeData.chairman.phone
        );
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Create New Event
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Create your event and set up the executive committee
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ minHeight: 400 }}>
          {activeStep === 0 && <EventDetailsStep eventData={eventData} setEventData={setEventData} />}
          {activeStep === 1 && (
            <ExecutiveCommitteeStep committeeData={committeeData} setCommitteeData={setCommitteeData} />
          )}
          {activeStep === 2 && <ReviewStep eventData={eventData} committeeData={committeeData} />}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Box>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid(activeStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleCreateEvent}
                disabled={createEventMutation.isPending || !isStepValid(activeStep)}
                startIcon={createEventMutation.isPending ? <CircularProgress size={20} /> : null}
              >
                {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Error Display */}
        {createEventMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to create event. Please try again.
          </Alert>
        )}
      </Paper>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={() => setShowSuccessDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            Event Setup Complete!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Your event "<strong>{eventData.event_name}</strong>" has been created successfully!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The executive committee has been set up, and user accounts have been created for:
          </Typography>
          <Box component="ul" sx={{ mt: 1 }}>
            {committeeData.chairman.full_name && (
              <li>
                <Typography variant="body2">
                  <strong>Chairman:</strong> {committeeData.chairman.full_name}
                </Typography>
              </li>
            )}
            {committeeData.treasurer.full_name && (
              <li>
                <Typography variant="body2">
                  <strong>Treasurer:</strong> {committeeData.treasurer.full_name}
                </Typography>
              </li>
            )}
            {committeeData.secretary.full_name && (
              <li>
                <Typography variant="body2">
                  <strong>Secretary:</strong> {committeeData.secretary.full_name}
                </Typography>
              </li>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            They can log in using their phone number or email address.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleGoToDashboard} autoFocus>
            Go to Event Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ==================== Step Components ====================

/**
 * Step 1: Event Details
 */
const EventDetailsStep: React.FC<{
  eventData: EventCreate;
  setEventData: React.Dispatch<React.SetStateAction<EventCreate>>;
}> = ({ eventData, setEventData }) => {
  const handleChange = (field: keyof EventCreate) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setEventData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Event Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide basic details about the event
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Event Name"
            placeholder="e.g., John Doe Funeral, Annual Conference"
            value={eventData.event_name}
            onChange={handleChange('event_name')}
            helperText="Enter a descriptive name for the event"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={eventData.event_type}
              onChange={handleChange('event_type')}
              label="Event Type"
            >
              <MenuItem value="FUNERAL">Funeral</MenuItem>
              <MenuItem value="WEDDING">Wedding</MenuItem>
              <MenuItem value="CORPORATE">Corporate Event</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            type="date"
            label="Event Date"
            value={eventData.event_date}
            onChange={handleChange('event_date')}
            InputLabelProps={{ shrink: true }}
            helperText="When will the event take place?"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Location"
            placeholder="e.g., Nairobi, Kenya"
            value={eventData.location}
            onChange={handleChange('location')}
            helperText="Where will the event be held?"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description (Optional)"
            placeholder="Enter additional details about the event..."
            value={eventData.description}
            onChange={handleChange('description')}
            helperText="Provide any additional context or information"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * Step 2: Executive Committee Setup
 */
const ExecutiveCommitteeStep: React.FC<{
  committeeData: {
    chairman: { full_name: string; phone: string; email: string };
    treasurer: { full_name: string; phone: string; email: string };
    secretary: { full_name: string; phone: string; email: string };
  };
  setCommitteeData: React.Dispatch<
    React.SetStateAction<{
      chairman: { full_name: string; phone: string; email: string };
      treasurer: { full_name: string; phone: string; email: string };
      secretary: { full_name: string; phone: string; email: string };
    }>
  >;
}> = ({ committeeData, setCommitteeData }) => {
  const handleChange = (role: 'chairman' | 'treasurer' | 'secretary', field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCommitteeData((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: e.target.value,
      },
    }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Executive Committee Members
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide details for your executive committee. User accounts will be created for them
        automatically, and they can log in using their phone number or email.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> You (the event owner) plus these three members will automatically
          form the <strong>Executive Committee</strong>. At least a Chairman is required.
        </Typography>
      </Alert>

      {/* Chairman */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
          Chairman (Required)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Full Name"
              placeholder="e.g., John Doe"
              value={committeeData.chairman.full_name}
              onChange={handleChange('chairman', 'full_name')}
              helperText="Full legal name"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Phone Number"
              placeholder="e.g., 0726953346"
              value={committeeData.chairman.phone}
              onChange={handleChange('chairman', 'phone')}
              helperText="Will be used for login"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="email"
              label="Email Address (Optional)"
              placeholder="e.g., john@example.com"
              value={committeeData.chairman.email}
              onChange={handleChange('chairman', 'email')}
              helperText="Can also be used for login"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Treasurer */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
          Treasurer (Optional)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Full Name"
              placeholder="e.g., Jane Smith"
              value={committeeData.treasurer.full_name}
              onChange={handleChange('treasurer', 'full_name')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="e.g., 0712345678"
              value={committeeData.treasurer.phone}
              onChange={handleChange('treasurer', 'phone')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              placeholder="e.g., jane@example.com"
              value={committeeData.treasurer.email}
              onChange={handleChange('treasurer', 'email')}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Secretary */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
          Secretary (Optional)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Full Name"
              placeholder="e.g., Alice Johnson"
              value={committeeData.secretary.full_name}
              onChange={handleChange('secretary', 'full_name')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="e.g., 0798765432"
              value={committeeData.secretary.phone}
              onChange={handleChange('secretary', 'phone')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              placeholder="e.g., alice@example.com"
              value={committeeData.secretary.email}
              onChange={handleChange('secretary', 'email')}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

/**
 * Step 3: Review & Create
 */
const ReviewStep: React.FC<{
  eventData: EventCreate;
  committeeData: {
    chairman: { full_name: string; phone: string; email: string };
    treasurer: { full_name: string; phone: string; email: string };
    secretary: { full_name: string; phone: string; email: string };
  };
}> = ({ eventData, committeeData }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review & Confirm
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review the information before creating the event
      </Typography>

      <Grid container spacing={3}>
        {/* Event Details */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Event Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Event Name:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {eventData.event_name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Type:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {eventData.event_type}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Date:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {new Date(eventData.event_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Location:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {eventData.location}
                </Typography>
              </Grid>
              {eventData.description && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description:
                  </Typography>
                  <Typography variant="body1">{eventData.description}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Executive Committee */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Executive Committee
            </Typography>
            <Grid container spacing={2}>
              {committeeData.chairman.full_name && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Chairman:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {committeeData.chairman.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {committeeData.chairman.phone}
                    {committeeData.chairman.email && ` • ${committeeData.chairman.email}`}
                  </Typography>
                </Grid>
              )}
              {committeeData.treasurer.full_name && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Treasurer:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {committeeData.treasurer.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {committeeData.treasurer.phone}
                    {committeeData.treasurer.email && ` • ${committeeData.treasurer.email}`}
                  </Typography>
                </Grid>
              )}
              {committeeData.secretary.full_name && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Secretary:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {committeeData.secretary.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {committeeData.secretary.phone}
                    {committeeData.secretary.email && ` • ${committeeData.secretary.email}`}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Click "Create Event" to proceed. User accounts will be created for the executive committee
          members, and they will receive login credentials to access the system.
        </Typography>
      </Alert>
    </Box>
  );
};

export default EventSetupWizard;
