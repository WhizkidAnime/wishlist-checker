/**
 * Storage Stubs - заглушки для localStorage функций
 * 
 * Этот модуль заменяет localStorage операции на no-op функции,
 * эффективно отключая локальное хранение в пользу Supabase.
 * 
 * Функции сохраняют совместимость с оригинальными сигнатурами,
 * но не выполняют операций сохранения/загрузки.
 */

import { WishlistItem } from '../types/wishlistItem';
import { STORAGE_CONFIG, storageLogger } from '../config/storage';

/**
 * Заглушка для загрузки данных - всегда возвращает null для данных приложения
 * Исключение: тема - сохраняется в localStorage если разрешено
 */
export function loadFromLocalStorage<T = any>(key: string): T | null {
  // Тема может использовать localStorage
  if (key === 'wishlist-theme-mode' && STORAGE_CONFIG.USE_LOCAL_STORAGE_FOR_THEME) {
    try {
      const serializedState = localStorage.getItem(key);
      if (serializedState === null) {
        return 'auto' as T;
      }
      
      // Если это просто строка (auto, light, dark), возвращаем как есть
      if (serializedState === 'auto' || serializedState === 'light' || serializedState === 'dark') {
        return serializedState as T;
      }
      
      try {
        return JSON.parse(serializedState) as T;
      } catch {
        return 'auto' as T;
      }
    } catch (error) {
      return 'auto' as T;
    }
  }
  
  // Для всех остальных ключей возвращаем null (данные будут из Supabase)
  storageLogger.info(`Заглушка loadFromLocalStorage для ключа: ${key} - возвращаем null`);
  return null;
}

/**
 * Заглушка для сохранения данных - только тема разрешена
 */
export function saveToLocalStorage<T = any>(key: string, state: T): void {
  // Тема может сохраняться в localStorage
  if (key === 'wishlist-theme-mode' && STORAGE_CONFIG.USE_LOCAL_STORAGE_FOR_THEME) {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(key, serializedState);
      storageLogger.info(`Сохранена тема в localStorage: ${state}`);
    } catch (error) {
      storageLogger.error(`Ошибка сохранения темы в localStorage:`, error);
    }
    return;
  }
  
  // Для всех остальных ключей ничего не делаем
  storageLogger.info(`Заглушка saveToLocalStorage для ключа: ${key} - игнорируем`);
}

/**
 * Заглушка для типизированной загрузки wishlist - всегда возвращает null
 */
export function loadWishlistFromLocalStorage(key: string): WishlistItem[] | null {
  storageLogger.info(`Заглушка loadWishlistFromLocalStorage для ключа: ${key} - возвращаем null`);
  return null;
}

/**
 * Заглушка для типизированного сохранения wishlist - ничего не делает
 */
export function saveWishlistToLocalStorage(key: string, state: WishlistItem[]): void {
  storageLogger.info(`Заглушка saveWishlistToLocalStorage для ключа: ${key} - игнорируем сохранение ${state.length} элементов`);
}

/**
 * Заглушка для очистки данных приложения - очищает только разрешенные ключи
 */
export function clearAllAppData(): void {
  storageLogger.info('Заглушка clearAllAppData - очищаем только разрешенные ключи');
  
  // Очищаем только тему если она разрешена, остальное игнорируем
  if (STORAGE_CONFIG.USE_LOCAL_STORAGE_FOR_THEME) {
    try {
      localStorage.removeItem('wishlist-theme-mode');
      storageLogger.info('Очищена тема из localStorage');
    } catch (error) {
      storageLogger.error('Ошибка очистки темы:', error);
    }
  }
  
  // Данные приложения не очищаем т.к. они в Supabase
  storageLogger.info('Данные приложения (wishlist, категории) не очищены - они в Supabase');
}

/**
 * Заглушка для удаления дубликатов - ничего не делает
 */
export function removeDuplicatesFromWishlist(): void {
  storageLogger.info('Заглушка removeDuplicatesFromWishlist - дубликаты обрабатываются в Supabase');
}

/**
 * Утилита для проверки - используется ли localStorage для данных
 */
export function isLocalStorageEnabled(): boolean {
  return STORAGE_CONFIG.USE_LOCAL_STORAGE;
}

/**
 * Информация о текущем режиме хранения
 */
export function getStorageInfo() {
  return {
    useLocalStorage: STORAGE_CONFIG.USE_LOCAL_STORAGE,
    useLocalStorageForTheme: STORAGE_CONFIG.USE_LOCAL_STORAGE_FOR_THEME,
    mode: STORAGE_CONFIG.USE_LOCAL_STORAGE ? 'Hybrid (localStorage + Supabase)' : 'Supabase Only',
    debug: STORAGE_CONFIG.DEBUG_STORAGE
  };
} 