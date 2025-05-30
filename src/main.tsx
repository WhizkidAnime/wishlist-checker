import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { clearAllCache } from './utils/clearCache'

// Делаем функции доступными глобально для пользователей
if (typeof window !== 'undefined') {
  (window as any).clearAllCache = clearAllCache;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
