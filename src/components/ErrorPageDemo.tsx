import React, { useState } from 'react';
import { ErrorPage } from './ErrorPage';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';

export const ErrorPageDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<'404' | 'auth' | 'server' | 'network'>('404');
  const { getThemeConfig } = useTheme();
  const { isMobile } = useResponsive();
  const themeConfig = getThemeConfig();

  const demos = {
    '404': {
      errorCode: '404',
      title: 'Страница не найдена',
      description: 'Запрашиваемая страница не существует или была перемещена. Возможно, вы перешли по устаревшей ссылке.'
    },
    'auth': {
      errorCode: '🔐',
      title: 'Ошибка авторизации',
      description: 'Не удалось выполнить вход в систему. Проверьте правильность данных и попробуйте снова.'
    },
    'server': {
      errorCode: '500',
      title: 'Ошибка сервера',
      description: 'Произошла внутренняя ошибка сервера. Попробуйте обновить страницу или повторите попытку позже.'
    },
    'network': {
      errorCode: '📶',
      title: 'Нет соединения',
      description: 'Проверьте подключение к интернету и попробуйте снова.'
    }
  };

  const currentDemoData = demos[currentDemo];

  return (
    <div className="min-h-screen">
      {/* Панель переключения демо */}
      <div className={`${themeConfig.background} py-4 px-4 border-b border-gray-200 dark:border-gray-700`}>
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-xl font-bold ${themeConfig.text} mb-4 text-center`}>
            Демонстрация ErrorPage с FuzzyText
          </h2>
          
          <div className={`flex flex-wrap justify-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
            {Object.entries(demos).map(([key, demo]) => (
              <button
                key={key}
                onClick={() => setCurrentDemo(key as any)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${currentDemo === key 
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                {demo.errorCode} {key.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Демонстрация ErrorPage */}
      <ErrorPage
        errorCode={currentDemoData.errorCode}
        title={currentDemoData.title}
        description={currentDemoData.description}
        onReturnHome={() => {
          // В демо режиме просто показываем алерт
          alert('В реальном приложении здесь был бы переход на главную страницу');
        }}
        showReturnButton={true}
      />
    </div>
  );
}; 