import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useIsMobile } from '../hooks/useIsMobile';
import { ThemeToggle } from './ThemeToggle';
import { UserProfile } from './UserProfile';

interface LandingPageProps {
  onAuthModalOpen: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthModalOpen }) => {
  const { signInWithGoogle, isSupabaseAvailable } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { 
    themeMode, 
    systemTheme, 
    getThemeConfig,
    supportsAutoTheme,
    setTheme
  } = useTheme();
  const themeConfig = getThemeConfig();

  const handleGoogleSignIn = async () => {
    if (!isSupabaseAvailable) {
      onAuthModalOpen();
      return;
    }

    // Детекция iOS PWA режима
    const isIOSPWA = () => {
      return (
        'standalone' in window.navigator &&
        (window.navigator as any).standalone === true &&
        /iPad|iPhone|iPod/.test(navigator.userAgent)
      );
    };

    // Предупреждение для iOS PWA пользователей
    if (isIOSPWA()) {
      const userConfirmed = window.confirm(
        'Для входа через Google в PWA режиме на iOS может потребоваться открыть приложение в Safari. Продолжить?'
      );
      
      if (!userConfirmed) {
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      // Специальная обработка для iOS
      if (isIOSPWA()) {
        setError('Для входа через Google в PWA режиме откройте приложение в Safari браузере');
      } else {
        setError(error instanceof Error ? error.message : 'Произошла ошибка при входе через Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: (
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      ),
      title: "Управление желаниями",
      description: "Добавляйте товары с названием, ссылкой и ценой. Отмечайте купленные и следите за прогрессом."
    },
    {
      icon: (
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
          />
        </svg>
      ),
      title: "Система категорий",
      description: "Организуйте желания по категориям: электроника, одежда, хобби и другие."
    },
    {
      icon: (
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
          />
        </svg>
      ),
      title: "Калькулятор расходов",
      description: "Выбирайте несколько товаров и мгновенно видите общую стоимость покупок."
    },
    {
      icon: (
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
      ),
      title: "Синхронизация",
      description: "Ваши данные автоматически синхронизируются между всеми устройствами."
    }
  ];

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center py-6 sm:py-12 px-2 sm:px-4 ${themeConfig.background} transition-colors duration-200`}>
      
      {/* Панель управления */}
      <div className={`${
        isMobile 
          ? 'static w-full flex justify-center mb-6 mt-0' 
          : 'fixed top-4 right-4 sm:top-6 sm:right-6 z-50'
      } flex items-center gap-2 ${
        isMobile ? 'max-w-fit' : ''
      }`}>
        <ThemeToggle
          themeMode={themeMode}
          systemTheme={systemTheme}
          onSetTheme={setTheme}
          supportsAutoTheme={supportsAutoTheme}
          isMobile={isMobile}
        />
        <UserProfile onSignInClick={onAuthModalOpen} />
      </div>

      {/* Основной контент */}
      <div className={`w-full max-w-4xl ${themeConfig.cardBackground} rounded-3xl shadow-lg p-6 sm:p-12 relative z-10 transition-colors duration-200 ${
        isMobile ? 'mt-0' : 'mt-16 sm:mt-0'
      }`}>
        
        {/* Заголовок и описание */}
        <div className="text-center mb-8 sm:mb-12">
          {/* Иконка приложения */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-700 to-black rounded-3xl flex items-center justify-center shadow-lg">
              <svg 
                className="w-8 h-8 sm:w-10 sm:h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ shapeRendering: 'geometricPrecision' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
            </div>
          </div>

          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${themeConfig.text} mb-4 transition-colors duration-200`}>
            Wishlist Checker
          </h1>
          
          <p className={`text-lg sm:text-xl ${themeConfig.text} opacity-80 mb-2 transition-colors duration-200`}>
            Умный планировщик покупок
          </p>
          
          <p className={`text-base sm:text-lg ${themeConfig.text} opacity-60 max-w-2xl mx-auto transition-colors duration-200`}>
            Создавайте список желаний, организуйте покупки по категориям, 
            отслеживайте расходы и синхронизируйте данные между устройствами
          </p>
        </div>

        {/* Функциональные возможности */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 sm:mb-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`p-6 rounded-2xl ${themeConfig.background} border border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:shadow-lg`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 text-white mb-4`}>
                {feature.icon}
              </div>
              <h3 className={`text-lg font-semibold ${themeConfig.text} mb-2 transition-colors duration-200`}>
                {feature.title}
              </h3>
              <p className={`text-sm ${themeConfig.text} opacity-70 transition-colors duration-200`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Кнопки авторизации */}
        <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
          <h3 className={`text-xl font-semibold ${themeConfig.text} mb-2 transition-colors duration-200`}>
            Начните сейчас
          </h3>
          
          {error && (
            <div className="w-full text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Основная кнопка авторизации */}
          <button
            onClick={onAuthModalOpen}
            disabled={loading}
            className={`w-full py-3 px-6 bg-gradient-to-r from-gray-800 to-black text-white rounded-xl 
                     hover:from-gray-700 hover:to-gray-900 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 font-medium flex items-center justify-center gap-3 shadow-lg hover:shadow-xl`}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ shapeRendering: 'geometricPrecision' }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
            Войти или создать аккаунт
          </button>

          {/* Разделитель */}
          <div className="flex items-center w-full">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className={`px-4 text-sm ${themeConfig.text} opacity-50`}>или</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Кнопка Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full py-3 px-6 border-2 border-gray-300 dark:border-gray-600 ${themeConfig.text} rounded-xl 
                     hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 font-medium flex items-center justify-center gap-3 shadow-sm hover:shadow-md`}
          >
            <svg width="20" height="20" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-2.7.75 4.8 4.8 0 0 1-4.52-3.29H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.46 10.48A4.8 4.8 0 0 1 4.21 9a4.8 4.8 0 0 1 .25-1.48V5.45H1.83A8 8 0 0 0 .98 9a8 8 0 0 0 .85 3.55l2.63-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.75c1.23 0 2.33.42 3.2 1.25l2.4-2.4A8 8 0 0 0 8.98 1a8 8 0 0 0-7.15 4.45l2.63 2.07A4.8 4.8 0 0 1 8.98 4.75z"/>
            </svg>
            {loading ? 'Выполняется вход...' : 'Продолжить с Google'}
          </button>

          {/* Предупреждение для iOS PWA */}
          {(() => {
            const isIOSPWA = 'standalone' in window.navigator &&
              (window.navigator as any).standalone === true &&
              /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (isIOSPWA) {
              return (
                <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Вход через Google в PWA режиме
                      </p>
                      <p className="text-amber-700 dark:text-amber-300">
                        Если возникнут проблемы, откройте приложение в Safari браузере для входа через Google.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <p className={`text-xs ${themeConfig.text} opacity-50 text-center mt-4`}>
            Создайте аккаунт с паролем или войдите через Google.<br/>
            Ваши данные защищены и синхронизируются между устройствами.
          </p>
        </div>
      </div>
    </div>
  );
}; 