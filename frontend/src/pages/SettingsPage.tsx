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
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import PWAInstallButton from '../components/PWAInstallButton';
import { authService } from '../services/auth.service';

/**
 * Settings Page - User Account Module
 * User preferences and account settings
 */
const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    preferredOTPMethod: localStorage.getItem('preferred_otp_method') || 'sms',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const updatedUser = await authService.updateProfile({
        full_name: formData.fullName,
        email: formData.email,
      });

      updateUser(updatedUser);
      localStorage.setItem('preferred_otp_method', formData.preferredOTPMethod);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (saveError: any) {
      setError(saveError?.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Profile Information
        </Typography>

        <TextField
          fullWidth
          label="Full Name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phone}
          disabled
          sx={{ mb: 2 }}
          helperText="Phone number cannot be changed"
        />

        <TextField
          fullWidth
          label="Email (optional)"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          sx={{ mb: 3 }}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Preferences
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Preferred OTP Method</InputLabel>
          <Select
            value={formData.preferredOTPMethod}
            label="Preferred OTP Method"
            onChange={(e) =>
              setFormData({ ...formData, preferredOTPMethod: e.target.value })
            }
          >
            <MenuItem value="sms">SMS</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="email">Email</MenuItem>
          </Select>
        </FormControl>

        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Settings saved successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 600, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          App Installation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Install EOMS on this device to launch it like a native app — no app store required.
        </Typography>
        <PWAInstallButton fullWidth showHelperText size="medium" />
      </Paper>
    </Box>
  );
};

export default SettingsPage;
