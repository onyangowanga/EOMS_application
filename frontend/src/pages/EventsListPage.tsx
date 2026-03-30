import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  Add,
  Event as EventIcon,
  LocationOn,
  TrendingUp,
  Visibility,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/event.service';
import type { Event } from '../types';

/**
 * Events List Page - Phase 7
 * 
 * Displays all events with cards showing:
 * - Event name, type, date, location
 * - Status chips
 * - Progress bars (financial & operational)
 * - Quick actions (View Dashboard)
 */
const EventsListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getAllEvents(),
  });

  const handleEventClick = (eventId: string) => {
    // Store last viewed event for smart redirection on next login
    localStorage.setItem('lastViewedEventId', eventId);
    console.log('📌 Saved last viewed event:', eventId);
    navigate(`/events/${eventId}/dashboard`);
  };

  if (isLoading) {
    return <EventsListSkeleton />;
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">Failed to load events. Please try again.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all your events from planning to completion
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/events/create')}
          size="large"
        >
          Create New Event
        </Button>
      </Box>

      {/* Events Grid */}
      {events && events.length > 0 ? (
        <Grid container spacing={3}>
          {events.filter(event => event && event.id).map((event) => (
            <Grid item xs={12} md={6} lg={4} key={event.id}>
              <EventCard event={event} onClick={() => handleEventClick(event.id)} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState onCreateEvent={() => navigate('/events/create')} />
      )}
    </Box>
  );
};

// ==================== Helper Components ====================

/**
 * Event Card Component
 */
const EventCard: React.FC<{ event: Event; onClick: () => void }> = ({ event, onClick }) => {
  // Defensive checks for event properties
  const eventName = event?.event_name || 'Unnamed Event';
  const eventType = event?.event_type || 'OTHER';
  const eventStatus = event?.status || 'PLANNING';
  const eventDate = event?.event_date || new Date().toISOString();
  const eventLocation = event?.location || 'Location TBD';
  const eventDescription = event?.description;
  const financialProgress = event?.financial_progress;
  const operationalProgress = event?.operational_progress;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          cursor: 'pointer',
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Event Name */}
        <Typography variant="h6" gutterBottom>
          {eventName}
        </Typography>

        {/* Event Type & Status Chips */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip
            icon={<EventIcon fontSize="small" />}
            label={eventType}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={getStatusDisplay(eventStatus)}
            size="small"
            color={getStatusColor(eventStatus) as any}
          />
        </Box>

        {/* Event Details */}
        <Box mb={2}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <EventIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {new Date(eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {eventLocation}
            </Typography>
          </Box>
        </Box>

        {/* Progress Bars */}
        {(financialProgress || operationalProgress) && (
          <Box>
            {financialProgress && (
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Financial Progress
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                    {parseFloat(financialProgress).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(financialProgress)}
                  sx={{ height: 6, borderRadius: 3 }}
                  color={parseFloat(financialProgress) >= 75 ? 'success' : 'primary'}
                />
              </Box>
            )}

            {operationalProgress && (
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Operational Progress
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                    {parseFloat(operationalProgress).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(operationalProgress)}
                  sx={{ height: 6, borderRadius: 3 }}
                  color={parseFloat(operationalProgress) >= 75 ? 'success' : 'info'}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Description (if exists) */}
        {eventDescription && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {eventDescription}
          </Typography>
        )}
      </CardContent>

      <CardActions>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={(e) => {
            e.stopPropagation();
            // Navigate is handled by card onClick
          }}
        >
          View Dashboard
        </Button>
      </CardActions>
    </Card>
  );
};

/**
 * Empty State Component
 */
const EmptyState: React.FC<{ onCreateEvent: () => void }> = ({ onCreateEvent }) => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        No Events Yet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Get started by creating your first event
      </Typography>
      <Button variant="contained" startIcon={<Add />} onClick={onCreateEvent} size="large">
        Create Your First Event
      </Button>
    </Box>
  );
};

/**
 * Events List Skeleton Loader
 */
const EventsListSkeleton: React.FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Skeleton variant="rectangular" width={180} height={42} sx={{ borderRadius: 1 }} />
      </Box>

      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} md={6} lg={4} key={i}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="80%" height={32} />
                <Box display="flex" gap={1} my={2}>
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 12 }} />
                  <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 12 }} />
                </Box>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="90%" />
                <Box mt={2}>
                  <Skeleton variant="rectangular" width="100%" height={6} sx={{ borderRadius: 3, mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={6} sx={{ borderRadius: 3 }} />
                </Box>
              </CardContent>
              <CardActions>
                <Skeleton variant="rectangular" width={120} height={30} sx={{ borderRadius: 1 }} />
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// ==================== Helper Functions ====================

function getStatusDisplay(status: string): string {
  const statusMap: { [key: string]: string } = {
    PLANNING: 'Planning',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return statusMap[status] || status;
}

function getStatusColor(status: string): 'default' | 'primary' | 'success' | 'error' {
  const colorMap: { [key: string]: 'default' | 'primary' | 'success' | 'error' } = {
    PLANNING: 'default',
    ACTIVE: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };
  return colorMap[status] || 'default';
}

export default EventsListPage;
