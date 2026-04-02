import React from 'react';
import { Alert, Button, Snackbar } from '@mui/material';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  });

  const handleClose = () => setNeedRefresh(false);

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      onClose={handleClose}
    >
      <Alert
        severity="info"
        onClose={handleClose}
        sx={{ alignItems: 'center' }}
        action={
          <Button color="inherit" size="small" onClick={() => updateServiceWorker(true)}>
            Refresh
          </Button>
        }
      >
        A new version is available - Refresh
      </Alert>
    </Snackbar>
  );
};

export default PWAUpdatePrompt;
