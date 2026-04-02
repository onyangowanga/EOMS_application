import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Notifications,
  Delete,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '../services/event.service';

/**
 * Notifications Center Page - User Account Module
 * Shows all user notifications
 */
const NotificationsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();

  const { data: notifications = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['my-notifications', eventId],
    queryFn: () => eventService.getMyNotifications(eventId, 50),
  });

  const formatRelativeTime = (value?: string) => {
    if (!value) return 'Just now';
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>

      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load notifications
        </Alert>
      )}

      {!isLoading && !error && (
      <Paper>
        <List>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications"
                secondary="You're all caught up!"
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <ListItem
                key={notification.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" disabled>
                    <Delete />
                  </IconButton>
                }
                sx={{
                  backgroundColor: notification.status === 'PENDING' ? '#f5f5f5' : 'transparent',
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <Notifications />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={notification.subject}
                  secondary={
                    <>
                      {(notification.notification_type_display || notification.channel || '').toString()}
                      <Typography
                        component="span"
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {formatRelativeTime(notification.created_at)}
                      </Typography>
                    </>
                  }
                />
                {notification.status === 'PENDING' && <Chip label="New" size="small" color="primary" />}
              </ListItem>
            ))
          )}
        </List>
      </Paper>
      )}
    </Box>
  );
};

export default NotificationsPage;
