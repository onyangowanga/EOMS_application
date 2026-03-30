import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Typography } from '@mui/material';
import { eventService } from '../services/event.service';
import { useAuth } from '../contexts/AuthContext';

/**
 * Smart redirect component for SINGLE EVENT system:
 * 
 * IMPORTANT: This system manages ONE umbrella event per deployment.
 * - First user (owner) creates THE event on first login
 * - All other users are added to this same event by admin
 * - Everyone works on the same event (no switching between events)
 * 
 * Logic:
 * 1. If event exists -> redirect to that event's dashboard
 * 2. If no event -> redirect to event creation (first-time owner setup)
 */
const DashboardRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const hasRefetchedOnce = useRef(false);
  
  const { data: events, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: () => eventService.getAllEvents(),
    enabled: !!user && !authLoading,
    // Always fetch fresh when user lands here to avoid stale cross-session cache behavior.
    refetchOnMount: 'always',
    retry: 2,
  });

  useEffect(() => {
    // Wait for both initial load and any in-flight refetch so we don't redirect from stale cached empty data.
    if (authLoading || isLoading || isFetching) return;

    // If the API request failed, do not redirect to create page (that masks real fetch problems).
    if (error) return;

    // Defensive: if data is unexpectedly undefined after loading, force one refetch before deciding.
    if (events === undefined && !hasRefetchedOnce.current) {
      hasRefetchedOnce.current = true;
      refetch();
      return;
    }

    if (events && events.length > 0) {
      // THE event exists - redirect to its dashboard
      const theEvent = events[0];
      navigate(`/events/${theEvent.id}/dashboard`, { replace: true });
    } else {
      // No event - first time owner setup
      navigate('/events/create', { replace: true });
    }
  }, [events, authLoading, isLoading, isFetching, error, refetch, navigate]);

  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        flexDirection="column"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Failed to load events
        </Typography>
        <Typography variant="body2">
          Please refresh the page or contact support
        </Typography>
      </Box>
    );
  }

  // Show loading while checking for events
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="80vh"
      flexDirection="column"
      gap={2}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        Loading your workspace...
      </Typography>
    </Box>
  );
};

export default DashboardRedirect;
