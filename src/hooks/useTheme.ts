import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeConfig {
  background: string;
  cardBackground: string;
  text: string;
  themeColor: string;
}

const themes: Record<Theme, ThemeConfig> = {
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

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('wishlist-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Если нет сохраненной темы, используем системную
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Обновляем meta тег theme-color при изменении темы
  useEffect(() => {
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute('content', themes[theme].themeColor);
    }
    
    // Сохраняем выбор темы в localStorage
    localStorage.setItem('wishlist-theme', theme);
    
    // Добавляем/убираем класс dark на html элемент для Tailwind
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  // Слушаем изменения системной темы
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Обновляем тему только если пользователь не выбирал тему вручную
      const savedTheme = localStorage.getItem('wishlist-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const getThemeConfig = () => themes[theme];

  return {
    theme,
    setTheme,
    toggleTheme,
    getThemeConfig,
    themes
  };
}; 