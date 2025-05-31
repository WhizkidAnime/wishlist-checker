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

export const getRedirectUrl = (): string => {
  const { protocol, hostname, port } = window.location;
  
  // Для iOS PWA используем специальный подход
  if (isIOSPWA()) {
    // Для PWA на iOS используем универсальный URL без auth/callback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${port}/wishlist-checker/`;
    }
    
    if (hostname.includes('github.io')) {
      return 'https://whizkidanime.github.io/wishlist-checker/';
    }
    
    return `${window.location.origin}/wishlist-checker/`;
  }
  
  // Стандартная логика для остальных случаев
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${port}/wishlist-checker/auth/callback`;
  }
  
  if (hostname.includes('github.io')) {
    return 'https://whizkidanime.github.io/wishlist-checker/auth/callback';
  }
  
  return `${window.location.origin}/wishlist-checker/auth/callback`;
};

export const getSiteUrl = (): string => {
  const { protocol, hostname, port } = window.location;
  
  // Если это локальная разработка
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${port}/wishlist-checker/`;
  }
  
  // Если это GitHub Pages
  if (hostname.includes('github.io')) {
    return 'https://whizkidanime.github.io/wishlist-checker/';
  }
  
  // Fallback для любых других доменов
  return `${window.location.origin}/wishlist-checker/`;
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