import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isRunningStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true // iOS Safari
  );
}

function detectIsIOS(): boolean {
  const ua = window.navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as "Macintosh" but has touch support
  const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return isIOSDevice || isIPadOS;
}

/**
 * Отдаёт:
 *  - canInstall: можно ли показать нативный диалог установки (Android/Chrome/Edge)
 *  - promptInstall(): вызвать нативный диалог установки
 *  - isIOS: устройство на iOS/iPadOS — там нативного диалога нет,
 *    установка только вручную через "Поделиться → На экран Домой"
 *  - isStandalone: приложение уже открыто как установленное (иконка с домашнего экрана)
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone] = useState(isRunningStandalone);
  const [isIOS] = useState(detectIsIOS);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt && !isStandalone,
    promptInstall,
    isIOS,
    isStandalone,
  };
}
