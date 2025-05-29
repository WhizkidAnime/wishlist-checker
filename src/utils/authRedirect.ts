/**
 * Утилита для определения правильного redirect URL для аутентификации
 * В зависимости от окружения (development/production)
 */

export const getRedirectUrl = (): string => {
  const { protocol, hostname, port } = window.location;
  
  // Если это локальная разработка
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${port}/wishlist-checker/auth/callback`;
  }
  
  // Если это GitHub Pages или другой production домен
  if (hostname.includes('github.io')) {
    return 'https://whizkidanime.github.io/wishlist-checker/auth/callback';
  }
  
  // Fallback для любых других доменов
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
}; 