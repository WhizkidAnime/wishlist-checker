import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { clearAllCache } from './utils/clearCache'
import { applySpaRedirect } from './bootstrap/spaRedirect'
import { attachLoaderHandlers } from './bootstrap/loaderBootstrap'
import { SUPABASE_URL } from './utils/supabaseClient'
import { applyUserTheme } from './bootstrap/themeBootstrap'

// Делаем функции доступными глобально для пользователей
if (typeof window !== 'undefined') {
  (window as any).clearAllCache = clearAllCache;
  // Применяем безопасные bootstrap-действия до рендера
  applySpaRedirect();
  applyUserTheme();
  attachLoaderHandlers();

  // Preconnect к Supabase для ускорения TLS/handshake
  try {
    if (SUPABASE_URL) {
      const origin = new URL(SUPABASE_URL).origin;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  } catch {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
