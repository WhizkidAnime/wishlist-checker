import React from 'react';
import { Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggleTheme: () => void;
  isMobile?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  theme, 
  onToggleTheme, 
  isMobile = false 
}) => {
  return (
    <div className={`flex ${isMobile ? 'justify-end' : 'justify-center'} items-center gap-1 p-1 bg-theme-toggle rounded-full transition-colors duration-200`}>
      {/* Кнопка светлой темы (солнце) */}
      <button
        onClick={() => theme === 'dark' && onToggleTheme()}
        className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
          theme === 'light'
            ? 'bg-theme-toggle-active text-yellow-500 shadow-sm'
            : 'text-gray-400 dark:text-gray-500 hover:text-yellow-400 dark:hover:text-yellow-400'
        }`}
        aria-label="Светлая тема"
        title="Светлая тема"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
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
      </button>

      {/* Кнопка темной темы (полумесяц) */}
      <button
        onClick={() => theme === 'light' && onToggleTheme()}
        className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
          theme === 'dark'
            ? 'bg-theme-toggle-active text-blue-400 shadow-sm'
            : 'text-gray-400 hover:text-blue-500'
        }`}
        aria-label="Темная тема"
        title="Темная тема"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
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
      </button>
    </div>
  );
}; 