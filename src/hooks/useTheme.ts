import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';

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

// Функция для сохранения темы в Supabase
const saveThemeToSupabase = async (themeMode: ThemeMode, userId: string) => {
  if (!isSupabaseAvailable() || !supabase) return;
  
  try {
    // Используем upsert для автоматического создания или обновления записи
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        theme: themeMode
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error('Error updating theme in Supabase:', error);
    }
  } catch (error) {
    console.error('Error saving theme to Supabase:', error);
  }
};

// Функция для загрузки темы из Supabase
const loadThemeFromSupabase = async (userId: string): Promise<ThemeMode | null> => {
  if (!isSupabaseAvailable() || !supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('theme')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Error loading theme from Supabase:', error);
      return null;
    }
    
    if (data?.theme && ['light', 'dark', 'auto'].includes(data.theme)) {
      return data.theme as ThemeMode;
    }
    
    return null;
  } catch (error) {
    console.warn('Error loading theme from Supabase:', error);
    return null;
  }
};

export const useTheme = (userId?: string | null) => {
  // Инициализация режима темы
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    
    // Проверяем сохранённый режим темы в localStorage (fallback)
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

  // Состояние для отслеживания загрузки темы из Supabase
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Текущая применяемая тема
  const [actualTheme, setActualTheme] = useState<ActualTheme>(() => {
    if (themeMode === 'auto') {
      return getSystemTheme();
    }
    return themeMode as ActualTheme;
  });

  // Загрузка темы из Supabase при входе пользователя
  useEffect(() => {
    const loadUserTheme = async () => {
      if (userId && !isThemeLoaded) {
        const supabaseTheme = await loadThemeFromSupabase(userId);
        if (supabaseTheme) {
          setThemeMode(supabaseTheme);
          localStorage.setItem('wishlist-theme-mode', supabaseTheme);
        }
        setIsThemeLoaded(true);
      } else if (!userId) {
        setIsThemeLoaded(true);
      }
    };

    loadUserTheme();
  }, [userId, isThemeLoaded]);

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
    
    // TODO: Временно отключено автоматическое сохранение в Supabase
    // Нужно настроить правильную схему user_preferences
    // if (userId && isThemeLoaded) {
    //   saveThemeToSupabase(themeMode, userId);
    // }
    
    // Добавляем/убираем класс dark на html элемент для Tailwind
    const html = document.documentElement;
    if (currentTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [themeMode, updateActualTheme, userId, isThemeLoaded]);

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