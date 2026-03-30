import React from 'react';
import { Box, Paper, Typography, Button, Stack } from '@mui/material';
import { WhatsApp, Sms, Email } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Select OTP Method Page - Authentication Module
 * Allows user to choose how they want to receive their OTP
 */
const SelectOTPMethodPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';

  const handleMethodSelect = (method: 'whatsapp' | 'sms' | 'email') => {
    navigate('/verify-otp', { state: { phone, method } });
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: '#f5f5f5' }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" align="center" gutterBottom>
          How would you like to receive your OTP?
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          We'll send a verification code to: {phone}
        </Typography>

        <Stack spacing={2}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<WhatsApp />}
            onClick={() => handleMethodSelect('whatsapp')}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            WhatsApp
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Sms />}
            onClick={() => handleMethodSelect('sms')}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            SMS
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Email />}
            onClick={() => handleMethodSelect('email')}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            Email
          </Button>
        </Stack>

        <Button
          variant="text"
          onClick={() => navigate('/login')}
          sx={{ mt: 2, width: '100%' }}
        >
          Back
        </Button>
      </Paper>
    </Box>
  );
};

export default SelectOTPMethodPage;
