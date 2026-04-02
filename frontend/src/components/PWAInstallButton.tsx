import React, { useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { SystemUpdateAlt as SystemUpdateAltIcon } from '@mui/icons-material';
import { usePWAInstallPrompt } from '../hooks/usePWAInstallPrompt';

interface PWAInstallButtonProps {
  fullWidth?: boolean;
  showHelperText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  fullWidth = false,
  showHelperText = false,
  size = 'small',
}) => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstallPrompt();
  const [isPrompting, setIsPrompting] = useState(false);

  const isIOS = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  }, []);

  const handleInstall = async () => {
    if (!canInstall || isPrompting) {
      return;
    }

    try {
      setIsPrompting(true);
      await promptInstall();
    } finally {
      setIsPrompting(false);
    }
  };

  const label = isInstalled
    ? 'App Installed'
    : canInstall
      ? 'Install App'
      : isIOS
        ? 'Add to Home Screen'
        : 'Install Unavailable';

  const helperText = isInstalled
    ? 'EOMS is already installed on this device.'
    : canInstall
      ? 'Install EOMS for a faster, app-like experience.'
      : isIOS
        ? 'On iPhone/iPad, open Share menu then tap Add to Home Screen.'
        : 'Install prompt will appear after browser PWA criteria are met.';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: fullWidth ? 'stretch' : 'flex-start' }}>
      <Button
        variant={canInstall ? 'outlined' : 'text'}
        color="primary"
        size={size}
        fullWidth={fullWidth}
        startIcon={<SystemUpdateAltIcon fontSize={size === 'small' ? 'small' : 'medium'} />}
        onClick={handleInstall}
        disabled={!canInstall || isPrompting || isInstalled}
        sx={{ mr: fullWidth ? 0 : 1, whiteSpace: 'nowrap' }}
        aria-label="Install App"
      >
        {label}
      </Button>
      {showHelperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default PWAInstallButton;
