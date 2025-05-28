import React, { useState } from 'react';
import { ThemeMode, ActualTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  themeMode: ThemeMode;
  systemTheme: ActualTheme;
  onSetTheme: (mode: ThemeMode) => void;
  isMobile?: boolean;
  supportsAutoTheme?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  themeMode,
  systemTheme,
  onSetTheme, 
  isMobile = false,
  supportsAutoTheme = true
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Функция для получения стилей кнопки в зависимости от активности (для десктопа)
  const getButtonStyles = (mode: ThemeMode, isActive: boolean) => {
    const baseStyles = "p-2 rounded-full transition-all duration-200 flex items-center justify-center gap-1";
    
    if (isActive) {
      switch (mode) {
        case 'auto':
          return `${baseStyles} bg-theme-toggle-active text-purple-500 shadow-sm`;
        case 'light':
          return `${baseStyles} bg-theme-toggle-active text-yellow-500 shadow-sm`;
        case 'dark':
          return `${baseStyles} bg-theme-toggle-active text-blue-400 shadow-sm`;
        default:
          return `${baseStyles} bg-theme-toggle-active text-gray-500 shadow-sm`;
      }
    } else {
      return `${baseStyles} text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-theme-toggle-hover`;
    }
  };

  // Функция для получения иконки темы
  const getThemeIcon = (mode: ThemeMode, size: string = "h-4 w-4") => {
    switch (mode) {
      case 'auto':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={size} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        );
      case 'light':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={size} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
            />
          </svg>
        );
      case 'dark':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={size} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // Мобильная версия - выпадающий список
  if (isMobile) {
    return (
      <div className="relative">
        {/* Кнопка для открытия выпадающего списка */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 p-2 rounded-full bg-theme-toggle text-theme-secondary hover:bg-theme-toggle-hover transition-all duration-200 shadow-sm"
          aria-label="Выбор темы"
        >
          {getThemeIcon(themeMode)}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Выпадающий список */}
        {isDropdownOpen && (
          <>
            {/* Overlay для закрытия при клике вне */}
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Сам выпадающий список */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-theme-card border border-theme rounded-lg shadow-xl z-[9999] overflow-hidden">
              {/* Авто */}
              {supportsAutoTheme && (
                <button
                  onClick={() => {
                    onSetTheme('auto');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-theme-toggle-hover transition-colors duration-200 ${
                    themeMode === 'auto' ? 'bg-theme-toggle-active text-purple-500' : 'text-theme-secondary'
                  }`}
                >
                  {getThemeIcon('auto')}
                  <span className="text-sm font-medium">Авто</span>
                  {themeMode === 'auto' && (
                    <span className="text-xs text-theme-muted ml-auto">
                      ({systemTheme === 'dark' ? 'тёмная' : 'светлая'})
                    </span>
                  )}
                </button>
              )}
              
              {/* Светлая */}
              <button
                onClick={() => {
                  onSetTheme('light');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-theme-toggle-hover transition-colors duration-200 ${
                  themeMode === 'light' ? 'bg-theme-toggle-active text-yellow-500' : 'text-theme-secondary'
                }`}
              >
                {getThemeIcon('light')}
                <span className="text-sm font-medium">Светлая</span>
              </button>
              
              {/* Тёмная */}
              <button
                onClick={() => {
                  onSetTheme('dark');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-theme-toggle-hover transition-colors duration-200 ${
                  themeMode === 'dark' ? 'bg-theme-toggle-active text-blue-400' : 'text-theme-secondary'
                }`}
              >
                {getThemeIcon('dark')}
                <span className="text-sm font-medium">Тёмная</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Десктопная версия - три кнопки
  return (
    <div className="flex justify-center items-center gap-1 p-1 bg-theme-toggle rounded-full transition-colors duration-200">
      
      {/* Кнопка автоматической темы */}
      <button
        onClick={() => onSetTheme('auto')}
        className={getButtonStyles('auto', themeMode === 'auto')}
        aria-label={`Автоматическая тема (сейчас: ${systemTheme === 'dark' ? 'тёмная' : 'светлая'})`}
        title={`Автоматическая тема (сейчас: ${systemTheme === 'dark' ? 'тёмная' : 'светлая'})`}
        disabled={!supportsAutoTheme}
      >
        {getThemeIcon('auto')}
        <span className="text-xs font-medium">Авто</span>
      </button>

      {/* Кнопка светлой темы */}
      <button
        onClick={() => onSetTheme('light')}
        className={getButtonStyles('light', themeMode === 'light')}
        aria-label="Светлая тема"
        title="Светлая тема"
      >
        {getThemeIcon('light')}
        <span className="text-xs font-medium">Светлая</span>
      </button>

      {/* Кнопка тёмной темы */}
      <button
        onClick={() => onSetTheme('dark')}
        className={getButtonStyles('dark', themeMode === 'dark')}
        aria-label="Тёмная тема"
        title="Тёмная тема"
      >
        {getThemeIcon('dark')}
        <span className="text-xs font-medium">Тёмная</span>
      </button>

      {/* Подсказка о поддержке автоматической темы */}
      {!supportsAutoTheme && (
        <div className="ml-1 text-xs text-theme-muted" title="Автоматическая тема не поддерживается в этом браузере">
          ⚠️
        </div>
      )}
    </div>
  );
}; 