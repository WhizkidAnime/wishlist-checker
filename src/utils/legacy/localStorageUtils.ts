/**
 * LEGACY MODULE - localStorage utilities
 * 
 * Этот модуль содержит оригинальный код для работы с localStorage.
 * В настоящее время отключен в пользу Supabase синхронизации.
 * 
 * Чтобы восстановить localStorage функционал:
 * 1. Измените STORAGE_CONFIG.USE_LOCAL_STORAGE на true в src/config/storage.ts
 * 2. Обновите импорты в хуках с './storageStubs' на './legacy/localStorageUtils'
 * 
 * Дата отключения: ${new Date().toISOString().split('T')[0]}
 * Причина: конфликты с Supabase синхронизацией, проблемы с восстановлением удаленных элементов
 */

import { WishlistItem } from '../../types/wishlistItem';

/**
 * Загружает данные из Local Storage по ключу.
 * Обрабатывает ошибки парсинга JSON.
 */
export function loadFromLocalStorage<T = any>(key: string): T | null {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      // Для темы возвращаем дефолтное значение без ошибки
      if (key === 'wishlist-theme-mode') {
        return 'auto' as T;
      }
      return null; // Нет данных по ключу
    }
    
    // Специальная обработка для темы - может быть строкой без JSON
    if (key === 'wishlist-theme-mode') {
      // Если это просто строка (auto, light, dark), возвращаем как есть
      if (serializedState === 'auto' || serializedState === 'light' || serializedState === 'dark') {
        return serializedState as T;
      }
      // Если это JSON, попробуем распарсить
      try {
        return JSON.parse(serializedState) as T;
      } catch {
        // Если не удалось распарсить, возвращаем дефолтное значение
        return 'auto' as T;
      }
    }
    
    return JSON.parse(serializedState) as T;
  } catch (error) {
    // Для темы не логируем ошибку, просто возвращаем дефолт
    if (key === 'wishlist-theme-mode') {
      return 'auto' as T;
    }
    
    console.error(`Ошибка загрузки или парсинга данных из Local Storage (ключ: ${key}):`, error);
    return null;
  }
}

/**
 * Сохраняет данные в Local Storage по ключу.
 * Обрабатывает ошибки сериализации JSON.
 */
export function saveToLocalStorage<T = any>(key: string, state: T): void {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.error(`Ошибка сохранения данных в Local Storage (ключ: ${key}):`, error);
  }
}

// Типизированные вспомогательные функции для совместимости
export function loadWishlistFromLocalStorage(key: string): WishlistItem[] | null {
  return loadFromLocalStorage<WishlistItem[]>(key);
}

export function saveWishlistToLocalStorage(key: string, state: WishlistItem[]): void {
  return saveToLocalStorage<WishlistItem[]>(key, state);
}

/**
 * Очищает все данные приложения из localStorage (для тестирования)
 */
export function clearAllAppData(): void {
  const keys = ['wishlistApp', 'wishlistCategories', 'wishlist-theme-mode'];
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Очищен ключ: ${key}`);
    } catch (error) {
      console.warn(`Не удалось очистить ключ ${key}:`, error);
    }
  });
  console.log('✅ Все данные приложения очищены');
}

/**
 * Удаляет дубликаты из wishlist в localStorage
 */
export function removeDuplicatesFromWishlist(): void {
  try {
    const wishlist: WishlistItem[] = loadFromLocalStorage('wishlistApp') || [];
    
    if (wishlist.length === 0) {
      console.log('📦 Wishlist пуст, дубликатов нет');
      return;
    }

    // Удаляем дубликаты по name + category
    const uniqueItems = wishlist.filter((item, index, self) => 
      index === self.findIndex(t => t.name === item.name && t.category === item.category)
    );

    const duplicatesCount = wishlist.length - uniqueItems.length;
    
    if (duplicatesCount > 0) {
      saveToLocalStorage('wishlistApp', uniqueItems);
      console.log(`🧹 Удалено ${duplicatesCount} дубликатов из localStorage`);
      
      // Уведомляем компоненты об обновлении
      window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));
    } else {
      console.log('✅ Дубликатов в localStorage не найдено');
    }
    
  } catch (error) {
    console.error('Ошибка очистки дубликатов:', error);
  }
} 