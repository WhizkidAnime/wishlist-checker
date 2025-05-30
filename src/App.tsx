import { useState, useEffect } from 'react';
import './App.css'

import { AuthModal, AuthCallback, LandingPage, MainApp } from './components';

import { useAuth, useSupabaseSync } from './hooks';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authSuccessDelay, setAuthSuccessDelay] = useState(false);

  // Аутентификация и синхронизация
  const { user, isAuthenticated } = useAuth();
  const { triggerSync } = useSupabaseSync(user?.id || null);

  // Отслеживаем изменение isAuthenticated для автоматического показа экрана загрузки
  useEffect(() => {
    if (isAuthenticated && isAuthModalOpen) {
      // Пользователь только что вошел - показываем экран загрузки
      setAuthSuccessDelay(true);
      
      // Через 1 секунду скрываем экран загрузки и закрываем модальное окно
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setAuthSuccessDelay(false);
      }, 1000);
    }
  }, [isAuthenticated, isAuthModalOpen]);

  // Проверяем, является ли это auth callback
  const isAuthCallback = window.location.search.includes('code=') || window.location.pathname.includes('/auth/callback');
  
  // Если это auth callback, показываем компонент обработки
  if (isAuthCallback) {
    return <AuthCallback />;
  }

  // Устаревшая функция - оставляем для обратной совместимости
  const handleAuthSuccess = () => {
    // console.log('handleAuthSuccess вызван (устаревший)');
    // Эта функция больше не нужна, так как мы используем хук useAuth
  };

  // Показываем экран загрузки только во время задержки после успешного входа
  const shouldShowLoadingScreen = authSuccessDelay;
  
  // Показываем основное приложение только если пользователь аутентифицирован И нет задержки
  const shouldShowMainApp = isAuthenticated && !authSuccessDelay;

  return (
    <>
      {/* Основной контент - условный рендеринг */}
      {shouldShowLoadingScreen ? (
        // Экран загрузки во время показа сообщения об успешной авторизации
        <div className="min-h-screen flex items-center justify-center bg-theme-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
            <p className="text-theme-text">Загрузка приложения...</p>
          </div>
        </div>
      ) : shouldShowMainApp ? (
        <MainApp 
          triggerSync={triggerSync} 
          onAuthModalOpen={() => setIsAuthModalOpen(true)}
        />
      ) : (
        <LandingPage 
          onAuthModalOpen={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Модальное окно аутентификации */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default App
