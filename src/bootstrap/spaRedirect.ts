// Безопасная обработка ?redirect= для GitHub Pages SPA
export function applySpaRedirect(): void {
  try {
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


