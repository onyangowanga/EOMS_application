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
  Stack,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const deliveryMethod: 'email' = 'email';
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background:
          'radial-gradient(circle at top left, rgba(88,196,221,0.2), transparent 24%), linear-gradient(180deg, #f8fcff 0%, #eef6fb 45%, #e7f2f8 100%)',
      }}
    >
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
          gap: { xs: 3, md: 4 },
          alignItems: 'center',
          py: { xs: 3, md: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: 6,
            background: 'linear-gradient(180deg, rgba(11,60,82,0.95) 0%, rgba(15,110,140,0.92) 100%)',
            color: '#f4fbff',
            overflow: 'hidden',
            position: 'relative',
            minHeight: { md: 540 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at top right, rgba(88,196,221,0.22), transparent 24%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 20%)',
            }}
          />
          <Box sx={{ position: 'relative' }}>
            <Chip label="Mobile-first workspace" sx={{ bgcolor: alpha('#ffffff', 0.14), color: '#f4fbff', mb: 3 }} />
            <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '2.9rem' }, mb: 2 }}>
              Calm operations for busy event teams.
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 500, color: alpha('#f4fbff', 0.84), mb: 4 }}>
              Track budgets, approvals, clusters, providers, and tasks in one clean control surface built for phones first and still strong on desktop.
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2" sx={{ color: alpha('#f4fbff', 0.88) }}>
                Live finance visibility across collections and expenses.
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#f4fbff', 0.88) }}>
                Quick approvals and treasury workflows without screen clutter.
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#f4fbff', 0.88) }}>
                Responsive views tailored for field coordination and office review.
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
            <Typography variant="caption" sx={{ color: alpha('#f4fbff', 0.68), letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Events Operations Management System
            </Typography>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4.5 }, borderRadius: 6, backdropFilter: 'blur(12px)', backgroundColor: alpha('#ffffff', 0.8) }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <img 
              src="/favicon_io/android-chrome-192x192.png" 
              alt="EOMS Logo" 
              style={{ width: '96px', height: '96px' }}
            />
          </Box>
          <Typography variant="overline" gutterBottom align="center" color="primary.main" sx={{ display: 'block', letterSpacing: '0.12em', fontWeight: 800 }}>
            Secure sign in
          </Typography>
          <Typography variant="h4" gutterBottom align="center">
            Welcome back
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Events Operations Management System
          </Typography>
          
          <Box mt={1}>
            <Typography variant="body1" gutterBottom color="text.secondary">
              Sign in with your phone number or username
            </Typography>
            <Alert severity="info" sx={{ mt: 2, mb: 1 }}>
              OTP delivery is currently available by email only. SMS is temporarily inactive.
            </Alert>
            
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
                sx={{ mt: 3, minHeight: 52 }}
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : `Send OTP via ${deliveryMethod.toUpperCase()}`}
              </Button>
            </form>
          </Box>
        </Paper>
      </Box>
    </Container>
    </Box>
  );
};

export default LoginPage;
