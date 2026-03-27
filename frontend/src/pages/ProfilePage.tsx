import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => {
      updateUser(data);
      setSuccess('Profile updated successfully');
      setError('');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update profile');
      setSuccess('');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      setSuccess('Password changed successfully');
      setError('');
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to change password');
      setSuccess('');
    },
  });

  const handleUpdateProfile = () => {
    if (!profileData.full_name) {
      setError('Full name is required');
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = () => {
    if (!passwordData.old_password || !passwordData.new_password) {
      setError('All password fields are required');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    changePasswordMutation.mutate({
      old_password: passwordData.old_password,
      new_password: passwordData.new_password,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Full Name"
                  fullWidth
                  value={profileData.full_name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, full_name: e.target.value })
                  }
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
                <TextField
                  label="Phone"
                  fullWidth
                  disabled
                  value={user?.phone || ''}
                  helperText="Phone number cannot be changed"
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Role:
                  </Typography>
                  <Chip label={user?.role || ''} color="primary" sx={{ ml: 1 }} />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  value={passwordData.old_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, old_password: e.target.value })
                  }
                />
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, new_password: e.target.value })
                  }
                  helperText="At least 8 characters"
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirm_password: e.target.value })
                  }
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
