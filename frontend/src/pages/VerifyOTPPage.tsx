import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const VerifyOTPPage: React.FC = () => {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier || '';
  const deliveryMethod = location.state?.deliveryMethod || 'sms';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOTP(identifier, otpCode);
      // Navigate to dashboard after successful verification
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  if (!identifier) {
    navigate('/login');
    return null;
  }

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
              style={{ width: '80px', height: '80px' }}
            />
          </Box>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Verify OTP
          </Typography>
          
          <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
            Enter the 6-digit code sent via {deliveryMethod.toUpperCase()}
          </Typography>
          
          <Box mt={4}>
            <form onSubmit={handleSubmit}>
              <TextField
                label="OTP Code"
                type="text"
                fullWidth
                margin="normal"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                required
                inputProps={{ maxLength: 6 }}
              />

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
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              <Button
                variant="text"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </form>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyOTPPage;
