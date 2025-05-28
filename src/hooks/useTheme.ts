import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ActualTheme = 'light' | 'dark';

interface ThemeConfig {
  background: string;
  cardBackground: string;
  text: string;
  themeColor: string;
}

const themes: Record<ActualTheme, ThemeConfig> = {
  light: {
    background: 'bg-theme-background',
    cardBackground: 'bg-theme-card',
    text: 'text-theme-primary',
    themeColor: '#f9fafb'
  },
  dark: {
    background: 'bg-theme-background',
    cardBackground: 'bg-theme-card',
    text: 'text-theme-primary',
    themeColor: '#141414'
  }
};

// Функция для надёжного определения системной темы
const getSystemTheme = (): ActualTheme => {
  // Проверяем поддержку prefers-color-scheme
  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      // Проверяем тёмную тему
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (darkQuery.matches) return 'dark';
      
      // Проверяем светлую тему
      const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
      if (lightQuery.matches) return 'light';
      
      // Если ни одна не совпадает, но поддержка есть, проверяем no-preference
      const noPreferenceQuery = window.matchMedia('(prefers-color-scheme: no-preference)');
      if (noPreferenceQuery.matches) {
        // Fallback на время суток
        const hour = new Date().getHours();
        return (hour >= 18 || hour <= 6) ? 'dark' : 'light';
      }
    } catch (error) {
      console.warn('Error detecting system theme:', error);
    }
  }
  
  // Fallback для старых браузеров или ошибок - используем время суток
  const hour = new Date().getHours();
  return (hour >= 18 || hour <= 6) ? 'dark' : 'light';
};

// Функция для проверки поддержки prefers-color-scheme
const supportsColorSchemeQuery = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  
  try {
    // Проверяем, поддерживается ли prefers-color-scheme
    const testQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return typeof testQuery.matches === 'boolean';
  } catch {
    return false;
  }
};

export const useTheme = () => {
  // Инициализация режима темы
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    
    // Проверяем сохранённый режим темы
    const savedMode = localStorage.getItem('wishlist-theme-mode') as ThemeMode;
    if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
      return savedMode;
    }
    
    // Миграция со старой системы
    const oldTheme = localStorage.getItem('wishlist-theme') as ActualTheme;
    if (oldTheme && ['light', 'dark'].includes(oldTheme)) {
      // Удаляем старый ключ
      localStorage.removeItem('wishlist-theme');
      return oldTheme;
    }
    
    // По умолчанию - автоматический режим
    return 'auto';
  });

  // Текущая применяемая тема
  const [actualTheme, setActualTheme] = useState<ActualTheme>(() => {
    if (themeMode === 'auto') {
      return getSystemTheme();
    }
    return themeMode as ActualTheme;
  });

  // Функция для обновления применяемой темы
  const updateActualTheme = useCallback(() => {
    if (themeMode === 'auto') {
      const systemTheme = getSystemTheme();
      setActualTheme(systemTheme);
      return systemTheme;
    } else {
      setActualTheme(themeMode as ActualTheme);
      return themeMode as ActualTheme;
    }
  }, [themeMode]);

  // Обновляем meta тег theme-color и класс dark при изменении темы
  useEffect(() => {
    const currentTheme = updateActualTheme();
    
    // Обновляем meta тег theme-color
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute('content', themes[currentTheme].themeColor);
    }
    
    // Сохраняем режим темы в localStorage
    localStorage.setItem('wishlist-theme-mode', themeMode);
    
    // Добавляем/убираем класс dark на html элемент для Tailwind
    const html = document.documentElement;
    if (currentTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [themeMode, updateActualTheme]);

  // Слушаем изменения системной темы только в auto режиме
  useEffect(() => {
    if (themeMode !== 'auto' || !supportsColorSchemeQuery()) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (themeMode === 'auto') {
        updateActualTheme();
      }
    };

    // Современный способ (поддерживается в новых браузерах)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback для старых браузеров
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [themeMode, updateActualTheme]);

  // Циклическое переключение: auto → light → dark → auto
  const toggleTheme = () => {
    setThemeMode(prevMode => {
      switch (prevMode) {
        case 'auto':
          return 'light';
        case 'light':
          return 'dark';
        case 'dark':
          return 'auto';
        default:
          return 'auto';
      }
    });
  };

  // Установка конкретного режима темы
  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const getThemeConfig = () => themes[actualTheme];

  // Проверяем, применяется ли системная тема
  const isSystemTheme = themeMode === 'auto';
  
  // Получаем текущую системную тему (для отображения в UI)
  const systemTheme = getSystemTheme();

  return {
    themeMode,
    actualTheme,
    systemTheme,
    isSystemTheme,
    setTheme,
    toggleTheme,
    getThemeConfig,
    themes,
    supportsAutoTheme: supportsColorSchemeQuery()
  };
}; 