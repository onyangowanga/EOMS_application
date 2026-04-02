import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

const SetInitialPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.setInitialPassword({
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      updateUser(response.user);
      setSuccess('Password set successfully. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box display="flex" flexDirection="column" justifyContent="center" minHeight="100vh" py={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Set Your Password
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
            This is your first login. Create a password for future sign-ins.
          </Typography>

          <Box mt={3} component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? 'Saving...' : 'Save Password'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SetInitialPasswordPage;
