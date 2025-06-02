import { useState, useEffect } from 'react';

export type SystemTheme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Получает сохраненную тему пользователя из localStorage
 * Использует ту же логику, что и основное приложение
 */
const getSavedTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'auto';
  
  // Проверяем сохранённый режим темы в localStorage
  const savedMode = localStorage.getItem('wishlist-theme-mode') as ThemeMode;
  if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
    return savedMode;
  }
  
  // Миграция со старой системы
  const oldTheme = localStorage.getItem('wishlist-theme') as SystemTheme;
  if (oldTheme && ['light', 'dark'].includes(oldTheme)) {
    return oldTheme;
  }
  
  // По умолчанию - автоматический режим
  return 'auto';
};

/**
 * Определяет системную тему через CSS media query
 */
const detectSystemTheme = (): SystemTheme => {
  if (typeof window === 'undefined') return 'light';
  
  if (window.matchMedia) {
    try {
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (darkQuery.matches) {
        return 'dark';
      }
    } catch (error) {
      console.warn('Error detecting system theme:', error);
    }
  }
  
  // Fallback на время суток
  const hour = new Date().getHours();
  return (hour >= 18 || hour <= 6) ? 'dark' : 'light';
};

/**
 * Определяет актуальную тему для экранов загрузки
 * Использует сохраненные настройки пользователя
 */
export const getLoadingScreenTheme = (): SystemTheme => {
  const savedThemeMode = getSavedTheme();
  
  switch (savedThemeMode) {
    case 'dark':
      return 'dark';
    case 'light':
      return 'light';
    case 'auto':
      return detectSystemTheme();
    default:
      return detectSystemTheme();
  }
};

/**
 * Возвращает CSS классы для экранов загрузки
 * Использует сохраненные настройки пользователя
 */
export const getSystemThemeClasses = (theme: SystemTheme) => {
  if (theme === 'dark') {
    return {
      background: 'bg-gray-900',
      card: 'bg-gray-800',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      primary: 'text-blue-400',
      border: 'border-gray-700',
      spinner: 'border-gray-700 border-t-blue-400'
    };
  }
  
  return {
    background: 'bg-gray-50',
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    primary: 'text-blue-600',
    border: 'border-gray-200',
    spinner: 'border-gray-200 border-t-blue-600'
  };
};

/**
 * Принудительно обновляет тему экранов загрузки
 * Полезно для синхронизации при изменении настроек в приложении
 */
export const updateLoadingScreenTheme = () => {
  // Создаем событие для уведомления всех компонентов об изменении темы
  const event = new CustomEvent('loadingScreenThemeUpdate');
  window.dispatchEvent(event);
};

/**
 * Хук для отслеживания изменений темы экранов загрузки
 * Следит за изменениями в localStorage и системной темы
 */
export const useSystemTheme = () => {
  const [systemTheme, setSystemTheme] = useState<SystemTheme>(() => {
    return getLoadingScreenTheme();
  });

  useEffect(() => {
    const updateTheme = () => {
      const newTheme = getLoadingScreenTheme();
      setSystemTheme(newTheme);
    };

    // Слушаем изменения в localStorage (когда пользователь меняет тему в приложении)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wishlist-theme-mode') {
        updateTheme();
      }
    };

    // Слушаем изменения системной темы (для режима auto)
    const handleSystemThemeChange = () => {
      const savedMode = getSavedTheme();
      if (savedMode === 'auto') {
        updateTheme();
      }
    };

    // Слушаем кастомное событие для принудительного обновления
    const handleCustomUpdate = () => {
      updateTheme();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('loadingScreenThemeUpdate', handleCustomUpdate);
    
    if (window.matchMedia) {
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkQuery.addEventListener('change', handleSystemThemeChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('loadingScreenThemeUpdate', handleCustomUpdate);
        darkQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loadingScreenThemeUpdate', handleCustomUpdate);
    };
  }, []);

  return systemTheme;
}; 