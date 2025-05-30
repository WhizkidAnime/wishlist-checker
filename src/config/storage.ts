/**
 * Конфигурация системы хранения
 * USE_THEME_STORAGE - управляет использованием localStorage только для темы
 * При true: тема сохраняется в localStorage для быстрого доступа
 * При false: тема загружается только из Supabase (может быть медленнее)
 */

// Флаг для темы - можно оставить в localStorage (не создает конфликтов)
export const USE_THEME_STORAGE = true;

export const STORAGE_CONFIG = {
  useThemeStorage: USE_THEME_STORAGE,
  themeStorageKey: 'wishlist-theme-mode'
} as const;

export const storageLogger = {
  log: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗄️ Storage: ${message}`);
    }
  }
}; 