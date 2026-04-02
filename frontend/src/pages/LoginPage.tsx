import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Collapse,
  Stack,
  Chip,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  EmailOutlined,
  PhoneOutlined,
  PersonOutline,
  LockOutlined,
  Visibility,
  VisibilityOff,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Close as CloseIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

type LoginMode = 'otp' | 'password';
type DeliveryMethod = 'email' | 'sms';
type IdentifierKind = 'email' | 'phone' | 'unknown';

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const sanitizeInput = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  return trimmed.replace(/[\s-]/g, '');
};

const normalizePhone = (value: string): string => {
  const sanitized = value.replace(/[\s-]/g, '');
  if (sanitized.startsWith('+254')) {
    return sanitized;
  }
  if (sanitized.startsWith('254')) {
    return `+${sanitized}`;
  }
  if (sanitized.startsWith('0')) {
    return `+254${sanitized.slice(1)}`;
  }
  return sanitized;
};

const isValidKenyanPhone = (value: string): boolean => {
  const normalized = normalizePhone(value);
  return /^\+254[17]\d{8}$/.test(normalized);
};

const detectIdentifierKind = (value: string): IdentifierKind => {
  if (!value) {
    return 'unknown';
  }
  if (value.includes('@')) {
    return isValidEmail(value) ? 'email' : 'unknown';
  }
  return isValidKenyanPhone(value) ? 'phone' : 'unknown';
};

const mapAuthError = (err: any, mode: LoginMode, method?: DeliveryMethod): string => {
  const raw =
    err?.response?.data?.error ||
    err?.response?.data?.detail ||
    err?.message ||
    '';
  const msg = String(raw).toLowerCase();

  if (msg.includes('not found') || msg.includes('no user') || msg.includes('invalid credentials')) {
    return mode === 'password'
      ? 'Account not found or password is incorrect.'
      : 'Account not found. Check your email or phone number and try again.';
  }
  if (msg.includes('email') && msg.includes('invalid')) {
    return 'Invalid email format. Please enter a valid email address.';
  }
  if (msg.includes('phone') && (msg.includes('invalid') || msg.includes('format'))) {
    return 'Invalid phone number. Use 07xx, 01xx, or +2547xx format.';
  }
  if (msg.includes('otp') && (msg.includes('delivery') || msg.includes('send') || msg.includes('deliver'))) {
    return method === 'sms'
      ? 'OTP could not be delivered by SMS right now. Try Email OTP.'
      : 'OTP could not be delivered. Confirm your identifier and try again.';
  }
  if (msg.includes('invalid otp')) {
    return 'Invalid OTP. Please check the code and try again.';
  }
  if (msg.includes('otp has expired')) {
    return 'OTP has expired. Please request a new one.';
  }
  if (msg.includes('no email is registered')) {
    return 'This account has no email configured.';
  }
  if (msg.includes('no phone number is registered')) {
    return 'This account has no phone number configured.';
  }
  if (msg.includes('password login is not enabled')) {
    return 'Password login is not enabled on this server yet. Please use OTP login.';
  }

  return mode === 'password' ? 'Login failed. Please check your credentials and try again.' : 'Failed to send OTP. Please try again.';
};

interface FlashAlertProps {
  message: string;
  severity?: 'error' | 'success' | 'warning' | 'info';
  onClose?: () => void;
}

const flashConfig = {
  error:   { color: '#c62828', bg: 'rgba(198,40,40,0.07)', border: '#ef5350', Icon: ErrorOutlineIcon },
  success: { color: '#1b5e20', bg: 'rgba(27,94,32,0.07)',  border: '#66bb6a', Icon: CheckCircleOutlineIcon },
  warning: { color: '#bf360c', bg: 'rgba(191,54,12,0.07)', border: '#ffa726', Icon: InfoOutlinedIcon },
  info:    { color: '#01579b', bg: 'rgba(1,87,155,0.07)',  border: '#29b6f6', Icon: InfoOutlinedIcon },
} as const;

const FlashAlert: React.FC<FlashAlertProps> = ({ message, severity = 'error', onClose }) => {
  const { color, bg, border, Icon } = flashConfig[severity];
  return (
    <Collapse in={!!message} unmountOnExit>
      <Box
        role="alert"
        aria-live="assertive"
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.25,
          px: 2,
          py: 1.25,
          mb: 2,
          borderRadius: 2,
          background: bg,
          borderLeft: `4px solid ${border}`,
          animation: 'flashSlideIn 0.22s ease-out',
          '@keyframes flashSlideIn': {
            from: { opacity: 0, transform: 'translateY(-8px)' },
            to:   { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Icon sx={{ fontSize: 18, color, mt: 0.25, flexShrink: 0 }} />
        <Typography variant="body2" sx={{ color, flex: 1, fontWeight: 500, lineHeight: 1.55 }}>
          {message}
        </Typography>
        {onClose && (
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Dismiss"
            sx={{ color, opacity: 0.55, ml: 0.5, p: 0.25, flexShrink: 0, '&:hover': { opacity: 1 } }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        )}
      </Box>
    </Collapse>
  );
};

const heroPanelSx = {
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
  animation: 'eomsFadeSlideLeft .55s ease-out',
  '@keyframes eomsFadeSlideLeft': {
    from: { opacity: 0, transform: 'translateX(-18px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
} as const;

const cardSx = {
  p: { xs: 3, sm: 4.5 },
  borderRadius: 6,
  backdropFilter: 'blur(12px)',
  backgroundColor: alpha('#ffffff', 0.82),
  border: `1px solid ${alpha('#0f6e8c', 0.12)}`,
  animation: 'eomsFadeSlideRight .55s ease-out',
  '@keyframes eomsFadeSlideRight': {
    from: { opacity: 0, transform: 'translateX(18px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
} as const;

const HeroPanel: React.FC = () => (
  <Paper elevation={0} sx={heroPanelSx}>
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
);

const LoginPage: React.FC = () => {
  const [loginMode, setLoginMode] = useState<LoginMode>('otp');
  const [identifier, setIdentifier] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');
  const [passwordIdentifier, setPasswordIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetDeliveryMethod, setResetDeliveryMethod] = useState<DeliveryMethod>('email');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetInfo, setResetInfo] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithPassword } = useAuth();
  const navigate = useNavigate();

  const cleanedOtpIdentifier = useMemo(() => sanitizeInput(identifier), [identifier]);
  const otpKind = useMemo(() => detectIdentifierKind(cleanedOtpIdentifier), [cleanedOtpIdentifier]);

  const otpHelperText = useMemo(() => {
    if (!cleanedOtpIdentifier) {
      return deliveryMethod === 'sms'
        ? 'Use Kenyan phone format: 07xx, 01xx, or +2547xx.'
        : 'Enter your email address or Kenyan phone number.';
    }

    if (deliveryMethod === 'sms') {
      return otpKind === 'phone' ? 'SMS OTP will be sent to this number.' : 'Invalid phone number for SMS OTP.';
    }

    return otpKind === 'unknown' ? 'Enter a valid email or Kenyan phone number.' : 'Email OTP will be delivered to your account contact channel.';
  }, [cleanedOtpIdentifier, deliveryMethod, otpKind]);

  const otpHasInputError = useMemo(() => {
    if (!cleanedOtpIdentifier) {
      return false;
    }
    if (deliveryMethod === 'sms') {
      return otpKind !== 'phone';
    }
    return otpKind === 'unknown';
  }, [cleanedOtpIdentifier, deliveryMethod, otpKind]);

  const cleanedPasswordIdentifier = useMemo(() => sanitizeInput(passwordIdentifier), [passwordIdentifier]);
  const passwordIdentifierHelper = useMemo(() => {
    if (!cleanedPasswordIdentifier) {
      return 'Use your email or username.';
    }
    if (cleanedPasswordIdentifier.includes('@') && !isValidEmail(cleanedPasswordIdentifier)) {
      return 'Invalid email format.';
    }
    return 'Credentials will be verified securely.';
  }, [cleanedPasswordIdentifier]);

  const passwordIdentifierError = useMemo(() => {
    return !!cleanedPasswordIdentifier && cleanedPasswordIdentifier.includes('@') && !isValidEmail(cleanedPasswordIdentifier);
  }, [cleanedPasswordIdentifier]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cleanedOtpIdentifier) {
      setError('Please enter your email or phone number.');
      return;
    }
    if (deliveryMethod === 'sms' && otpKind !== 'phone') {
      setError('Invalid phone number. Use 07xx, 01xx, or +2547xx format.');
      return;
    }
    if (deliveryMethod === 'email' && otpKind === 'unknown') {
      setError('Invalid email or phone number.');
      return;
    }

    setLoading(true);
    try {
      const payloadIdentifier = otpKind === 'phone' ? normalizePhone(cleanedOtpIdentifier) : cleanedOtpIdentifier;
      await login(payloadIdentifier, deliveryMethod);
      navigate('/verify-otp', { state: { identifier: payloadIdentifier, deliveryMethod } });
    } catch (err: any) {
      setError(mapAuthError(err, 'otp', deliveryMethod));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cleanedPasswordIdentifier) {
      setError('Please enter your email or username.');
      return;
    }
    if (passwordIdentifierError) {
      setError('Invalid email format.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(cleanedPasswordIdentifier, password);
      navigate('/');
    } catch (err: any) {
      setError(mapAuthError(err, 'password'));
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const openForgotPassword = () => {
    const preferredIdentifier = cleanedPasswordIdentifier || cleanedOtpIdentifier;
    setResetIdentifier(preferredIdentifier);
    setResetStep('request');
    setResetOtpCode('');
    setResetPassword('');
    setResetPasswordConfirm('');
    setResetInfo('');
    setResetError('');
    setForgotOpen(true);
  };

  const closeForgotPassword = () => {
    if (resetLoading) {
      return;
    }
    setForgotOpen(false);
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetInfo('');

    const cleaned = sanitizeInput(resetIdentifier);
    const kind = detectIdentifierKind(cleaned);

    if (!cleaned) {
      setResetError('Please enter your email, username, or phone number.');
      return;
    }
    if (resetDeliveryMethod === 'sms' && kind !== 'phone') {
      setResetError('SMS reset requires a valid Kenyan phone number.');
      return;
    }

    setResetLoading(true);
    try {
      const payloadIdentifier = kind === 'phone' ? normalizePhone(cleaned) : cleaned;
      const response = await authService.requestPasswordReset({
        identifier: payloadIdentifier,
        delivery_method: resetDeliveryMethod,
      });
      setResetIdentifier(payloadIdentifier);
      setResetInfo(response.message || 'OTP sent. Enter it below with your new password.');
      setResetStep('confirm');
    } catch (err: any) {
      setResetError(mapAuthError(err, 'otp', resetDeliveryMethod));
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetInfo('');

    if (!resetOtpCode.trim() || resetOtpCode.trim().length !== 6) {
      setResetError('Enter the 6-digit OTP code.');
      return;
    }
    if (resetPassword.length < 8) {
      setResetError('New password must be at least 8 characters.');
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    try {
      const response = await authService.confirmPasswordReset({
        identifier: sanitizeInput(resetIdentifier),
        otp_code: resetOtpCode.trim(),
        new_password: resetPassword,
      });
      setResetInfo(response.message || 'Password reset successful. You can now sign in with your new password.');
      setForgotOpen(false);
      setLoginMode('password');
      setPasswordIdentifier(sanitizeInput(resetIdentifier));
      setPassword('');
      setLoginSuccess('Password reset successful. Please sign in with your new password.');
    } catch (err: any) {
      setResetError(mapAuthError(err, 'password'));
    } finally {
      setResetLoading(false);
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
        <HeroPanel />

        <Paper elevation={0} sx={cardSx}>
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

          <Tabs
            value={loginMode}
            onChange={(_, value: LoginMode) => {
              setLoginMode(value);
              setError('');
            }}
            variant="fullWidth"
            sx={{ mb: 2 }}
            aria-label="Select login mode"
          >
            <Tab label="OTP Login" value="otp" />
            <Tab label="Password Login" value="password" />
          </Tabs>

          <FlashAlert message={loginSuccess} severity="success" onClose={() => setLoginSuccess('')} />
          <FlashAlert message={error} onClose={() => setError('')} />
          
          <Box mt={1}>
            {loginMode === 'otp' ? (
              <>
                <Typography variant="body1" gutterBottom color="text.secondary">
                  Sign in with OTP using your email or phone.
                </Typography>

                <ToggleButtonGroup
                  color="primary"
                  exclusive
                  value={deliveryMethod}
                  onChange={(_, value: DeliveryMethod | null) => {
                    if (value) {
                      setDeliveryMethod(value);
                      setError('');
                    }
                  }}
                  sx={{ mb: 1 }}
                  aria-label="OTP delivery method"
                  fullWidth
                  disabled={loading}
                >
                  <ToggleButton value="email" aria-label="Email OTP">
                    Email OTP
                  </ToggleButton>
                  <ToggleButton value="sms" aria-label="SMS OTP" disabled>
                    SMS OTP
                  </ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, px: 1.5, py: 0.75, mb: 1.5, borderRadius: 1.5, bgcolor: 'rgba(245,124,0,0.08)', border: '1px solid rgba(245,124,0,0.2)' }}>
                  <InfoOutlinedIcon sx={{ fontSize: 14, color: 'warning.dark', mt: 0.15, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ color: 'warning.dark', lineHeight: 1.45 }}>
                    SMS OTP is temporarily unavailable. Please use <strong>Email OTP</strong>.
                  </Typography>
                </Box>

                <form onSubmit={handleOtpSubmit}>
                  <TextField
                    label={deliveryMethod === 'sms' ? 'Phone Number' : 'Email or Phone Number'}
                    fullWidth
                    margin="normal"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError('');
                    }}
                    placeholder={deliveryMethod === 'sms' ? '07xx..., 01xx..., or +2547...' : 'name@example.com or 07xx...'}
                    required
                    error={otpHasInputError}
                    helperText={otpHelperText}
                    aria-label={deliveryMethod === 'sms' ? 'Enter phone number' : 'Enter email or phone number'}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {deliveryMethod === 'sms' ? <PhoneOutlined fontSize="small" /> : <EmailOutlined fontSize="small" />}
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 2, minHeight: 52 }}
                    disabled={loading || otpHasInputError}
                    aria-label={`Send OTP via ${deliveryMethod}`}
                  >
                    {loading ? (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={18} color="inherit" />
                        Sending OTP...
                      </Box>
                    ) : (
                      `Send OTP via ${deliveryMethod.toUpperCase()}`
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Typography variant="body1" gutterBottom color="text.secondary">
                  Sign in with your email or username and password.
                </Typography>

                <form onSubmit={handlePasswordSubmit}>
                  <TextField
                    label="Email or Username"
                    fullWidth
                    margin="normal"
                    value={passwordIdentifier}
                    onChange={(e) => {
                      setPasswordIdentifier(e.target.value);
                      setError('');
                    }}
                    placeholder="name@example.com or username"
                    required
                    error={passwordIdentifierError}
                    helperText={passwordIdentifierHelper}
                    aria-label="Enter email or username"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {cleanedPasswordIdentifier.includes('@') ? <EmailOutlined fontSize="small" /> : <PersonOutline fontSize="small" />}
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Password"
                    fullWidth
                    margin="normal"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    required
                    helperText="Use your account password."
                    aria-label="Enter password"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                    <Link
                      component="button"
                      type="button"
                      variant="body2"
                      onClick={openForgotPassword}
                      underline="hover"
                      aria-label="Forgot password"
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 2, minHeight: 52 }}
                    disabled={loading}
                    aria-label="Sign in with password"
                  >
                    {loading ? (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={18} color="inherit" />
                        Signing in...
                      </Box>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" align="center" color="text.secondary">
              Secure access for event teams, approvals, and treasury workflows.
            </Typography>
            <Typography variant="caption" align="center" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              © {currentYear} EOMS by Philbert Wanga
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Dialog open={forgotOpen} onClose={closeForgotPassword} fullWidth maxWidth="sm">
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <FlashAlert message={resetError} />
          <FlashAlert message={resetInfo} severity="success" />

          {resetStep === 'request' ? (
            <Box component="form" onSubmit={handleResetRequest} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Enter your identifier and choose where to receive your reset OTP.
              </Typography>
              <ToggleButtonGroup
                color="primary"
                exclusive
                value={resetDeliveryMethod}
                onChange={(_, value: DeliveryMethod | null) => {
                  if (value) {
                    setResetDeliveryMethod(value);
                    setResetError('');
                  }
                }}
                fullWidth
                disabled={resetLoading}
                sx={{ mb: 1.5 }}
              >
                <ToggleButton value="email">Email OTP</ToggleButton>
                <ToggleButton value="sms" disabled>SMS OTP</ToggleButton>
              </ToggleButtonGroup>

              <TextField
                label="Email, Username, or Phone"
                fullWidth
                margin="normal"
                value={resetIdentifier}
                onChange={(e) => {
                  setResetIdentifier(e.target.value);
                  setResetError('');
                }}
                required
                disabled={resetLoading}
                placeholder="name@example.com, username, or 07xx..."
              />

              <DialogActions sx={{ px: 0, pt: 2 }}>
                <Button onClick={closeForgotPassword} disabled={resetLoading}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={resetLoading}>
                  {resetLoading ? <CircularProgress size={18} color="inherit" /> : 'Send OTP'}
                </Button>
              </DialogActions>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleResetConfirm} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Enter the OTP and set your new password.
              </Typography>
              <TextField
                label="OTP Code"
                fullWidth
                margin="normal"
                value={resetOtpCode}
                onChange={(e) => {
                  setResetOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setResetError('');
                }}
                required
                disabled={resetLoading}
                inputProps={{ maxLength: 6 }}
              />
              <TextField
                label="New Password"
                fullWidth
                margin="normal"
                type="password"
                value={resetPassword}
                onChange={(e) => {
                  setResetPassword(e.target.value);
                  setResetError('');
                }}
                required
                disabled={resetLoading}
              />
              <TextField
                label="Confirm New Password"
                fullWidth
                margin="normal"
                type="password"
                value={resetPasswordConfirm}
                onChange={(e) => {
                  setResetPasswordConfirm(e.target.value);
                  setResetError('');
                }}
                required
                disabled={resetLoading}
              />

              <DialogActions sx={{ px: 0, pt: 2 }}>
                <Button
                  onClick={() => {
                    setResetStep('request');
                    setResetError('');
                    setResetInfo('');
                  }}
                  disabled={resetLoading}
                >
                  Back
                </Button>
                <Button type="submit" variant="contained" disabled={resetLoading}>
                  {resetLoading ? <CircularProgress size={18} color="inherit" /> : 'Reset Password'}
                </Button>
              </DialogActions>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
    </Box>
  );
};

export default LoginPage;
