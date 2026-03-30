import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'sms' | 'email'>('sms');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, deliveryMethod);
      // Navigate to OTP verification page
      navigate('/verify-otp', { state: { identifier, deliveryMethod } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        minHeight="100vh"
        py={4}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <img 
              src="/favicon_io/android-chrome-192x192.png" 
              alt="EOMS Logo" 
              style={{ width: '120px', height: '120px' }}
            />
          </Box>
          <Typography variant="h6" gutterBottom align="center" color="text.secondary">
            Events Operations Management
          </Typography>
          
          <Box mt={4}>
            <Typography variant="body1" gutterBottom>
              Sign in with your phone number or username
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <TextField
                label="Phone Number or Username"
                fullWidth
                margin="normal"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="0726953346 or username"
                required
                helperText="Enter your phone number or username"
              />

              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <FormLabel component="legend">How would you like to receive your OTP?</FormLabel>
                <RadioGroup
                  row
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'sms' | 'email')}
                >
                  <FormControlLabel value="sms" control={<Radio />} label="SMS" />
                  <FormControlLabel value="email" control={<Radio />} label="Email" />
                </RadioGroup>
              </FormControl>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : `Send OTP via ${deliveryMethod.toUpperCase()}`}
              </Button>
            </form>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
