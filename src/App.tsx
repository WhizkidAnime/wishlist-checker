import { useState, useEffect } from 'react';
import './App.css'

import { AuthModal, AuthCallback, LandingPage, MainApp, NotFoundPage, ErrorPageDemo } from './components';

import { useAuth, useSupabaseSync } from './hooks';
import { useSystemTheme, getSystemThemeClasses } from './utils/systemTheme';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authSuccessDelay, setAuthSuccessDelay] = useState(false);

  // Глобальные функции для тестирования (только в dev режиме)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).showErrorPageDemo = () => {
        window.location.href = '/wishlist-checker/demo/errors';
      };
      
      (window as any).show404 = () => {
        window.location.href = '/wishlist-checker/nonexistent-page';
      };
      
      console.log('🔧 Dev функции доступны:');
      console.log('- showErrorPageDemo() - открыть демо страниц ошибок');
      console.log('- show404() - открыть страницу 404');
    } else {
      // В production убираем функции
      delete (window as any).showErrorPageDemo;
      delete (window as any).show404;
    }
  }, []);

  // Аутентификация и синхронизация
  const { user, isAuthenticated, loading } = useAuth();
  const { triggerSync } = useSupabaseSync(user?.id || null);
  
  // Системная тема для экрана загрузки
  const systemTheme = useSystemTheme();
  const systemThemeClasses = getSystemThemeClasses(systemTheme);

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
  const isAuthCallback = window.location.search.includes('code=') || 
                        window.location.pathname.includes('/auth/callback') ||
                        window.location.hash.includes('access_token=') ||
                        window.location.search.includes('error=');
  
  // Проверяем путь для обработки 404
  const pathname = window.location.pathname;
  const validPaths = ['/', '/wishlist-checker/', '/wishlist-checker/auth/callback'];
  const isValidPath = validPaths.some(path => pathname === path || pathname.startsWith(path));
  
  // Демо режим только в development
  const isDemoMode = process.env.NODE_ENV === 'development' && pathname.includes('/demo/errors');
  
  // Если это auth callback, показываем компонент обработки
  if (isAuthCallback) {
    return <AuthCallback />;
  }
  
  // Если это демо режим, показываем демо
  if (isDemoMode) {
    return <ErrorPageDemo />;
  }
  
  // Если путь неизвестен, показываем 404
  if (!isValidPath && !pathname.includes('?redirect=')) {
    return <NotFoundPage onReturnHome={() => window.location.href = '/wishlist-checker/'} />;
  }

  // Устаревшая функция - оставляем для обратной совместимости
  const handleAuthSuccess = () => {
    // console.log('handleAuthSuccess вызван (устаревший)');
    // Эта функция больше не нужна, так как мы используем хук useAuth
  };

  // Показываем экран загрузки во время проверки авторизации ИЛИ после успешного входа
  const shouldShowLoadingScreen = loading || authSuccessDelay;
  
  // Показываем основное приложение только если проверка завершена, пользователь аутентифицирован И нет задержки
  const shouldShowMainApp = !loading && isAuthenticated && !authSuccessDelay;

  return (
    <>
      {/* Основной контент - условный рендеринг */}
      {shouldShowLoadingScreen ? (
        // Экран загрузки во время проверки авторизации или после успешного входа
        // Использует системную тему пользователя для мгновенной адаптации
        <div className={`min-h-screen flex items-center justify-center ${systemThemeClasses.background} transition-colors duration-200`}>
          <div className={`${systemThemeClasses.card} rounded-3xl shadow-lg p-8 text-center max-w-md mx-4 border ${systemThemeClasses.border}`}>
            <div className={`animate-spin rounded-full h-16 w-16 border-4 ${systemThemeClasses.spinner} mx-auto mb-6`}></div>
            <h2 className={`text-xl font-semibold ${systemThemeClasses.primary} mb-2`}>
              {authSuccessDelay ? 'Вход выполнен!' : 'Загрузка...'}
            </h2>
            <p className={systemThemeClasses.textSecondary}>
              {authSuccessDelay ? 'Перенаправляем в приложение' : 'Проверяем авторизацию'}
            </p>
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
