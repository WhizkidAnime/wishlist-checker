/**
 * Конфигурация системы хранения данных
 * 
 * USE_LOCAL_STORAGE - управляет использованием localStorage для данных приложения
 * При false: только Supabase для аутентифицированных пользователей, гостевой режим отключен
 * При true: гибридная система localStorage + Supabase
 */

export const STORAGE_CONFIG = {
  // Основной флаг - использовать ли localStorage для данных
  USE_LOCAL_STORAGE: false,
  
  // Всегда используем localStorage для темы (не создает конфликтов)
  USE_LOCAL_STORAGE_FOR_THEME: true,
  
  // Режим разработки - отключаем избыточные логи
  DEBUG_STORAGE: false,
  
  // Префиксы для ключей
  LOCAL_STORAGE_KEYS: {
    WISHLIST: 'wishlistApp',
    CATEGORIES: 'wishlistCategories', 
    THEME: 'wishlist-theme-mode',
    SYNC_STATE: 'wishlist-sync-state',
    LAST_MODIFIED: 'wishlist-last-modified',
    DATA_HASH: 'wishlist-data-hash'
  }
} as const;

/**
 * Логгер для операций хранения
 */
export const storageLogger = {
  info: (message: string, ...args: any[]) => {
    if (STORAGE_CONFIG.DEBUG_STORAGE) {
      console.log(`🗄️ [Storage] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (STORAGE_CONFIG.DEBUG_STORAGE) {
      console.warn(`⚠️ [Storage] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(`❌ [Storage] ${message}`, ...args);
  }
}; 