// Безопасная обработка ?redirect= для GitHub Pages SPA
export function applySpaRedirect(): void {
  try {
    // 1) Починка случая, когда провайдер вернул на корень /auth/callback вместо BASE_URL/auth/callback
    const baseFromEnv = (import.meta as any).env?.BASE_URL as string | undefined;
    const base = baseFromEnv && baseFromEnv.startsWith('/') ? (baseFromEnv.endsWith('/') ? baseFromEnv : baseFromEnv + '/') : undefined;
    const isRootCallback = window.location.pathname === '/auth/callback' || window.location.pathname === '/auth/callback/';
    if (isRootCallback && base && base !== '/') {
      const newUrl = `${base}auth/callback${window.location.search}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (!redirect) return;
    const newUrl = decodeURIComponent(redirect);
    if (newUrl.startsWith('/') && !newUrl.startsWith('//')) {
      const target = new URL(newUrl, window.location.origin);
      if (target.origin === window.location.origin) {
        window.history.replaceState(null, '', target.pathname + target.search + target.hash);
      }
    }
  } catch {
    // ignore
  }
}


