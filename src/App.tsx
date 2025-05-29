import { useState } from 'react';
import './App.css'

import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal, AuthCallback, LandingPage, MainApp } from './components';

import { useAuth, useSupabaseSync } from './hooks';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Аутентификация и синхронизация
  const { user, isAuthenticated } = useAuth();
  const { triggerSync } = useSupabaseSync(user?.id || null);

  // Проверяем, является ли это auth callback
  const isAuthCallback = window.location.search.includes('code=') || window.location.pathname.includes('/auth/callback');
  
  // Если это auth callback, показываем компонент обработки
  if (isAuthCallback) {
    return <AuthCallback />;
  }

  return (
    <>
      {/* Основной контент - условный рендеринг */}
      {isAuthenticated ? (
        <MainApp 
          triggerSync={triggerSync}
          onAuthModalOpen={() => setIsAuthModalOpen(true)}
        />
      ) : (
        <LandingPage 
          onAuthModalOpen={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Offline индикатор и уведомления об обновлениях */}
      <OfflineIndicator />

      {/* Модальное окно аутентификации */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}

export default App
