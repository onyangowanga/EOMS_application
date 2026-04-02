import { useCallback, useEffect, useMemo, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const isStandaloneMode = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return iosStandalone || displayModeStandalone;
};

export const usePWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(isStandaloneMode());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const canInstall = useMemo(() => !!deferredPrompt && !isInstalled, [deferredPrompt, isInstalled]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    const accepted = choice.outcome === 'accepted';

    if (accepted) {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    return accepted;
  }, [deferredPrompt]);

  return {
    canInstall,
    isInstalled,
    promptInstall,
  };
};
