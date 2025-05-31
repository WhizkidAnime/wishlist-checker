/**
 * Утилиты для поддержки iOS PWA и решения проблем с OAuth
 */

// Детекция iOS устройств
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Детекция iOS Safari
export const isIOSSafari = (): boolean => {
  return isIOS() && 
         /Safari/.test(navigator.userAgent) && 
         !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
};

// Детекция PWA режима на iOS
export const isIOSPWA = (): boolean => {
  return (
    'standalone' in window.navigator &&
    (window.navigator as any).standalone === true &&
    isIOS()
  );
};

// Детекция версии iOS
export const getIOSVersion = (): number | null => {
  if (!isIOS()) return null;
  
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : null;
};

// Проверка поддержки third-party cookies
export const supportsThirdPartyCookies = (): boolean => {
  const iosVersion = getIOSVersion();
  
  // iOS 16.1+ блокирует third-party cookies по умолчанию
  if (iosVersion && iosVersion >= 16) {
    return false;
  }
  
  return true;
};

// Рекомендуемый метод OAuth для текущего устройства
export const getRecommendedOAuthMethod = (): 'popup' | 'redirect' | 'external' => {
  if (isIOSPWA()) {
    // Для iOS PWA рекомендуем внешний браузер
    return 'external';
  }
  
  if (isIOSSafari() && !supportsThirdPartyCookies()) {
    // Для iOS Safari с блокировкой cookies используем popup
    return 'popup';
  }
  
  // Для остальных случаев используем redirect
  return 'redirect';
};

// Открытие OAuth в внешнем браузере для iOS PWA
export const openOAuthInExternalBrowser = (authUrl: string): void => {
  if (isIOSPWA()) {
    // Для iOS PWA открываем в Safari
    window.open(authUrl, '_blank');
  } else {
    // Для остальных случаев используем обычное перенаправление
    window.location.href = authUrl;
  }
};

// Показать предупреждение пользователю о проблемах OAuth на iOS
export const showIOSOAuthWarning = (): boolean => {
  if (!isIOSPWA()) return true;
  
  return window.confirm(
    'Для входа через Google в PWA режиме на iOS может потребоваться открыть приложение в Safari браузере.\n\nПродолжить?'
  );
};

// Получить сообщение об ошибке для iOS
export const getIOSOAuthErrorMessage = (error: any): string => {
  if (isIOSPWA()) {
    return 'Для входа через Google в PWA режиме откройте приложение в Safari браузере';
  }
  
  if (isIOSSafari()) {
    return 'Попробуйте разрешить cookies от третьих лиц в настройках Safari или используйте другой браузер';
  }
  
  return error instanceof Error ? error.message : 'Произошла ошибка при входе через Google';
};

// Логирование информации об устройстве для отладки
export const logDeviceInfo = (): void => {
  console.log('📱 Device Info:', {
    isIOS: isIOS(),
    isIOSSafari: isIOSSafari(),
    isIOSPWA: isIOSPWA(),
    iosVersion: getIOSVersion(),
    supportsThirdPartyCookies: supportsThirdPartyCookies(),
    recommendedOAuthMethod: getRecommendedOAuthMethod(),
    userAgent: navigator.userAgent,
    standalone: (window.navigator as any).standalone
  });
}; 