import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import './App.css'

// Ленивые импорты страниц/модалок для снижения стартового бандла
const AuthCallback = lazy(() => import('./components/AuthCallback').then(m => ({ default: m.AuthCallback })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const MainApp = lazy(() => import('./components/MainApp').then(m => ({ default: m.MainApp })));
const NotFoundPage = lazy(() => import('./components/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const SharedWishlistPage = lazy(() => import('./components/SharedWishlistPage').then(m => ({ default: m.SharedWishlistPage })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));

import { useAuth, useSupabaseSync } from './hooks';
import { useSystemTheme, getSystemThemeClasses } from './utils/systemTheme';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authSuccessDelay, setAuthSuccessDelay] = useState(false);
  const [routeKey, setRouteKey] = useState(Date.now()); // Для принудительного ререндера

  // Аутентификация и синхронизация
  const { user, isAuthenticated, loading } = useAuth();
  const { triggerSync } = useSupabaseSync(user?.id || null);
  
  // Обработка изменений URL через history API (для SPA навигации)
  useEffect(() => {
    const handlePopState = () => {
      setRouteKey(Date.now()); // Триггерим ререндер
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // Системная тема для экрана загрузки
  const systemTheme = useSystemTheme();
  const systemThemeClasses = getSystemThemeClasses(systemTheme);

  // Во время показа внутреннего экрана загрузки применяем класс html.dark по сохранённой теме,
  // чтобы CSS-переменные корректно раскрашивали лоадер до монтирования useTheme в MainApp
  useEffect(() => {
    const html = document.documentElement;
    if (loading || authSuccessDelay) {
      if (systemTheme === 'dark') html.classList.add('dark');
      else html.classList.remove('dark');
    }
  }, [loading, authSuccessDelay, systemTheme]);

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

  // Обработчик загрузки данных
  const handleDataLoaded = (loaded: boolean) => {
    // Отправляем глобальное событие для синхронизации с загрузочным экраном
    if (loaded) {
      const event = new CustomEvent('appDataLoaded');
      window.dispatchEvent(event);
    }
  };

  // Для неавторизованных пользователей сразу отправляем событие готовности
  useEffect(() => {
    if (isAuthenticated === false) {
      const event = new CustomEvent('appDataLoaded');
      window.dispatchEvent(event);
    }
  }, [isAuthenticated]);

  // Проверяем, является ли это auth callback (пересчитывается при изменении routeKey)
  const isAuthCallback = useMemo(() => {
    return window.location.search.includes('code=') || 
           window.location.pathname.includes('/auth/callback') ||
           window.location.hash.includes('access_token=') ||
           window.location.search.includes('error=');
  }, [routeKey]);
  
  // Проверяем путь для обработки 404
  const { pathname, isValidPath, isSharedView } = useMemo(() => {
    const pathname = window.location.pathname;
    const validPaths = ['/', '/wishlist-checker/', '/wishlist-checker/auth/callback'];
    const isValidPath = validPaths.some(path => pathname === path || pathname.startsWith(path));
    
    // Если это общая шаринг-страница (поддержка длинной и короткой ссылок)
    const isSharedView = window.location.search.includes('share=') || window.location.search.includes('s=');
    
    return { pathname, isValidPath, isSharedView };
  }, [routeKey]);

  // Если это auth callback, показываем компонент обработки
  if (isAuthCallback) {
    return (
      <Suspense fallback={null}>
        <AuthCallback />
      </Suspense>
    );
  }
  if (isSharedView) {
    return (
      <Suspense fallback={null}>
        <SharedWishlistPage />
      </Suspense>
    );
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
        <Suspense fallback={null}>
          <MainApp 
            triggerSync={triggerSync} 
            onAuthModalOpen={() => setIsAuthModalOpen(true)}
            onDataLoaded={handleDataLoaded}
          />
        </Suspense>
      ) : (
        <Suspense fallback={null}>
          <LandingPage 
            onAuthModalOpen={() => setIsAuthModalOpen(true)}
          />
        </Suspense>
      )}

      {/* Модальное окно аутентификации */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            onSuccess={handleAuthSuccess}
          />
        </Suspense>
      )}
    </>
  );
}

export default App
