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
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Settings Page - User Account Module
 * User preferences and account settings
 */
const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    preferredOTPMethod: 'sms',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Implement save functionality
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

        <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
          Save Changes
        </Button>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
