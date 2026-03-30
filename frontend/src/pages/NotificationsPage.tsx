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
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Delete,
  MarkEmailRead,
} from '@mui/icons-material';

/**
 * Notifications Center Page - User Account Module
 * Shows all user notifications
 */
const NotificationsPage: React.FC = () => {
  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New task assigned',
      message: 'You have been assigned to "Prepare venue"',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      title: 'Budget approved',
      message: 'Your budget item "Stage setup" has been approved',
      time: '5 hours ago',
      read: true,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>

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
                  <IconButton edge="end" aria-label="delete">
                    <Delete />
                  </IconButton>
                }
                sx={{
                  backgroundColor: notification.read ? 'transparent' : '#f5f5f5',
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <Notifications />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <>
                      {notification.message}
                      <Typography
                        component="span"
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {notification.time}
                      </Typography>
                    </>
                  }
                />
                {!notification.read && <Chip label="New" size="small" color="primary" />}
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default NotificationsPage;
