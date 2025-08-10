/**
 * Утилита для определения правильного redirect URL для аутентификации
 * В зависимости от окружения (development/production) и устройства
 */

// Детекция iOS PWA режима
const isIOSPWA = (): boolean => {
  return (
    'standalone' in window.navigator &&
    (window.navigator as any).standalone === true &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  );
};

// Детекция iOS Safari
const isIOSSafari = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
         /Safari/.test(navigator.userAgent) && 
         !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
};

const getBasePath = (): string => {
  try {
    // Vite подставляет BASE_URL на этапе сборки (например, '/wishlist-checker/')
    const base = (import.meta as any).env?.BASE_URL as string | undefined;
    if (base && base.startsWith('/')) {
      return base.endsWith('/') ? base : `${base}/`;
    }
  } catch {}
  // Fallback: пытаемся вычислить из путей GitHub Pages
  const pathname = window.location.pathname || '/';
  // Если сайт размещён как /<repo>/..., берём первую папку как base
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length > 0) {
    return `/${parts[0]}/`;
  }
  return '/';
};

export const getRedirectUrl = (): string => {
  const { protocol, hostname, port, origin } = window.location;
  const base = getBasePath();

  // Всегда возвращаем корень приложения (а не /auth/callback)
  // Это устраняет проблемы с GitHub Pages 404 на вложенных путях
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${port}${base}`;
  }
  return `${origin}${base}`;
};

export const getSiteUrl = (): string => {
  const { protocol, hostname, port, origin } = window.location;
  const base = getBasePath();

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${port}${base}`;
  }
  return `${origin}${base}`;
};

// Для отладки - покажет все URL в консоли
export const debugAuthUrls = (): void => {
  console.log('🔗 Auth URLs Debug:');
  console.log('Current origin:', window.location.origin);
  console.log('Redirect URL:', getRedirectUrl());
  console.log('Site URL:', getSiteUrl());
  console.log('Hostname:', window.location.hostname);
  console.log('Protocol:', window.location.protocol);
  console.log('Port:', window.location.port);
  console.log('Is iOS PWA:', isIOSPWA());
  console.log('Is iOS Safari:', isIOSSafari());
  console.log('User Agent:', navigator.userAgent);
}; 