import { useState, useEffect, useCallback } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorageUtils';
import { logger } from '../utils/logger';

// Упрощенное состояние только для внутреннего использования
interface InternalSyncState {
  isProcessing: boolean;
  lastProcessedHash: string | null;
  isInitialSyncComplete: boolean; // Новый флаг для отслеживания первой синхронизации
}

const SYNC_KEYS = {
  wishlist: 'wishlistApp',
  categories: 'wishlistCategories',
  theme: 'wishlist-theme-mode',
  lastModified: 'wishlist-last-modified',
  dataHash: 'wishlist-data-hash',
  syncComplete: 'wishlist-initial-sync-complete' // Новый ключ
} as const;

// Минимальный интервал между синхронизациями (5 секунд)
const MIN_SYNC_INTERVAL = 5000;
let lastSyncTime = 0;

export const useSupabaseSync = (userId: string | null) => {
  const [internalState, setInternalState] = useState<InternalSyncState>({
    isProcessing: false,
    lastProcessedHash: null,
    isInitialSyncComplete: false
  });

  // Функция для уведомления об обновлении данных
  const notifyDataUpdated = useCallback(() => {
    window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));
  }, []);

  // Генерация хеша данных для определения изменений
  const generateDataHash = useCallback((items: WishlistItem[], categories: string[], theme: string) => {
    const data = JSON.stringify({ items, categories, theme });
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }, []);

  // Конвертация локального элемента в формат Supabase
  const convertToSupabaseItem = (item: WishlistItem, userId: string) => ({
    user_id: userId,
    name: item.name,
    item_type: item.itemType || null,
    link: item.link || '',
    price: Number(item.price),
    currency: item.currency,
    is_bought: item.isBought,
    comment: item.comment || '',
    category: item.category || null,
    sort_order: 0
  });

  // Конвертация элемента Supabase в локальный формат
  const convertFromSupabaseItem = (dbItem: any): WishlistItem => ({
    id: dbItem.id,
    itemType: dbItem.item_type || '',
    name: dbItem.name,
    link: dbItem.link || '',
    price: Number(dbItem.price),
    currency: dbItem.currency,
    isBought: dbItem.is_bought,
    comment: dbItem.comment || '',
    category: dbItem.category || undefined
  });

  // Проверка необходимости синхронизации
  const needsSync = useCallback((forcedCheck = false) => {
    if (!userId || !isSupabaseAvailable()) return false;

    // Для принудительной проверки пропускаем временные ограничения
    if (!forcedCheck) {
      const now = Date.now();
      if (now - lastSyncTime < MIN_SYNC_INTERVAL) {
        return false;
      }
    }

    const localItems: WishlistItem[] = loadFromLocalStorage(SYNC_KEYS.wishlist) || [];
    const localCategories: string[] = loadFromLocalStorage(SYNC_KEYS.categories) || [];
    const localTheme: string = loadFromLocalStorage(SYNC_KEYS.theme) || 'light';
    
    const currentHash = generateDataHash(localItems, localCategories, localTheme);
    const lastHash = internalState.lastProcessedHash;

    return currentHash !== lastHash;
  }, [userId, generateDataHash, internalState.lastProcessedHash]);

  // ИСПРАВЛЕННАЯ синхронизация товаров - Supabase как источник истины
  const syncWishlistItems = useCallback(async (userId: string) => {
    if (!isSupabaseAvailable() || !supabase) return false;

    try {
      // ВСЕГДА сначала получаем данные из Supabase (источник истины)
      const { data: remoteItems, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const safeRemoteItems = remoteItems || [];
      const localItems: WishlistItem[] = loadFromLocalStorage(SYNC_KEYS.wishlist) || [];

      // Если это первая синхронизация после входа
      if (!internalState.isInitialSyncComplete) {
        // Просто загружаем данные из Supabase, игнорируя localStorage
        const convertedItems = safeRemoteItems.map(convertFromSupabaseItem);
        saveToLocalStorage(SYNC_KEYS.wishlist, convertedItems);
        notifyDataUpdated();
        
        // Отмечаем, что первая синхронизация завершена
        localStorage.setItem(SYNC_KEYS.syncComplete, 'true');
        setInternalState(prev => ({ ...prev, isInitialSyncComplete: true }));
        
        logger.sync(`Первая синхронизация: загружено ${convertedItems.length} товаров из облака`);
        return true;
      }

      // Для последующих синхронизаций - проверяем только новые локальные элементы
      const remoteIds = new Set(safeRemoteItems.map(item => item.id));
      const newLocalItems = localItems.filter(item => !remoteIds.has(item.id));
      
      if (newLocalItems.length > 0) {
        // Загружаем новые локальные элементы в Supabase
        for (const newItem of newLocalItems) {
          const supabaseItemPayload = convertToSupabaseItem(newItem, userId);
          
          const { data: insertedItem, error: insertError } = await supabase
            .from('wishlist_items')
            .insert(supabaseItemPayload)
            .select('*')
            .single();

          if (insertError) {
            logger.sync(`Ошибка при вставке товара ${newItem.name}:`, insertError);
            continue; 
          }

          if (insertedItem) {
            // Обновляем ID в локальных данных
            const updatedLocalItems = localItems.map(li => 
              li.id === newItem.id ? { ...li, id: insertedItem.id } : li
            );
            saveToLocalStorage(SYNC_KEYS.wishlist, updatedLocalItems);
          }
        }
        
        notifyDataUpdated();
        logger.sync(`Загружено ${newLocalItems.length} новых товаров в облако`);
        return true;
      }

      // Проверяем обновления существующих элементов
      let hasUpdates = false;
      for (const localItem of localItems) {
        const remoteItem = safeRemoteItems.find(r => r.id === localItem.id);
        if (remoteItem) {
          const localConverted = convertToSupabaseItem(localItem, userId);
          const needsUpdate = 
            localConverted.name !== remoteItem.name ||
            localConverted.price !== remoteItem.price ||
            localConverted.is_bought !== remoteItem.is_bought ||
            localConverted.comment !== remoteItem.comment;
            
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('wishlist_items')
              .update(localConverted)
              .eq('id', localItem.id);
              
            if (updateError) throw updateError;
            logger.sync(`Обновлён товар: ${localItem.name}`);
            hasUpdates = true;
          }
        }
      }
      
      return hasUpdates;
    } catch (error) {
      logger.sync('Ошибка синхронизации товаров:', error);
      return false;
    }
  }, [notifyDataUpdated, internalState.isInitialSyncComplete]);

  // Удаление элемента из Supabase
  const deleteWishlistItem = useCallback(async (itemId: string | number) => {
    if (!userId || !isSupabaseAvailable() || !supabase) {
      logger.sync('Удаление невозможно: нет соединения с Supabase');
      return false;
    }

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId); // Дополнительная проверка безопасности
        
      if (error) {
        logger.sync(`Ошибка удаления товара из Supabase (ID: ${itemId}):`, error);
        return false;
      }
      
      logger.sync(`Товар успешно удален из Supabase (ID: ${itemId})`);
      return true;
    } catch (error) {
      logger.sync('Ошибка при удалении товара:', error);
      return false;
    }
  }, [userId]);

  // ИСПРАВЛЕННАЯ синхронизация категорий
  const syncCategories = useCallback(async (userId: string) => {
    if (!isSupabaseAvailable() || !supabase) return false;

    try {
      // Сначала получаем данные из Supabase (источник истины)
      const { data: remoteCategories, error } = await supabase
        .from('user_categories')
        .select('name, user_id')
        .eq('user_id', userId);

      if (error) throw error;

      const safeCategoriesData = remoteCategories || [];
      const localCategories: string[] = loadFromLocalStorage(SYNC_KEYS.categories) || [];

      if (!internalState.isInitialSyncComplete) {
        // Первая синхронизация - загружаем из Supabase
        const categoryNames = safeCategoriesData.map((cat: { name: string }) => cat.name);
        saveToLocalStorage(SYNC_KEYS.categories, categoryNames);
        notifyDataUpdated();
        logger.sync(`Первая синхронизация: загружено ${categoryNames.length} категорий из облака`);
        return true;
      }

      // Для последующих синхронизаций - загружаем новые локальные категории
      const remoteNames = new Set(safeCategoriesData.map((cat: { name: string }) => cat.name));
      const newLocalCategories = localCategories.filter(name => !remoteNames.has(name));

      if (newLocalCategories.length > 0) {
        const categoriesToInsert = newLocalCategories.map(name => ({
          user_id: userId,
          name
        }));

        const { error: insertError } = await supabase
          .from('user_categories')
          .insert(categoriesToInsert);

        if (insertError) throw insertError;

        logger.sync(`Загружено ${newLocalCategories.length} новых категорий в облако`);
        return true;
      }

      return false;
    } catch (error) {
      logger.sync('Ошибка синхронизации категорий:', error);
      return false;
    }
  }, [notifyDataUpdated, internalState.isInitialSyncComplete]);

  // Синхронизация темы
  const syncTheme = useCallback(async (userId: string) => {
    if (!isSupabaseAvailable() || !supabase) return false;

    try {
      const localTheme = loadFromLocalStorage(SYNC_KEYS.theme) || 'light';

      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('theme')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (preferences) {
        saveToLocalStorage(SYNC_KEYS.theme, preferences.theme);
        logger.sync(`Загружена тема из облака: ${preferences.theme}`);
        return true;
      } else {
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            theme: localTheme
          });

        if (insertError) throw insertError;

        logger.sync(`Загружена тема в облако: ${localTheme}`);
        return true;
      }
    } catch (error) {
      logger.sync('Ошибка синхронизации темы:', error);
      return false;
    }
  }, []);

  // Прозрачная синхронизация в фоне
  const syncInBackground = useCallback(async () => {
    if (!userId || !isSupabaseAvailable()) return;
    
    if (internalState.isProcessing) {
      return;
    }

    if (!needsSync()) {
      return;
    }

    setInternalState(prev => ({ ...prev, isProcessing: true }));
    lastSyncTime = Date.now();

    try {
      logger.sync('Синхронизация данных...');
      
      await Promise.all([
        syncWishlistItems(userId),
        syncCategories(userId),
        syncTheme(userId)
      ]);

      // Обновляем хеш после успешной синхронизации
      const localItems: WishlistItem[] = loadFromLocalStorage(SYNC_KEYS.wishlist) || [];
      const localCategories: string[] = loadFromLocalStorage(SYNC_KEYS.categories) || [];
      const localTheme: string = loadFromLocalStorage(SYNC_KEYS.theme) || 'light';
      const newHash = generateDataHash(localItems, localCategories, localTheme);

      setInternalState(prev => ({ 
        ...prev, 
        isProcessing: false,
        lastProcessedHash: newHash
      }));

      logger.sync('✅ Синхронизация завершена');

    } catch (error) {
      setInternalState(prev => ({ ...prev, isProcessing: false }));
      logger.sync('❌ Ошибка синхронизации:', error);
    }
  }, [userId, needsSync, syncWishlistItems, syncCategories, syncTheme, generateDataHash, internalState.isProcessing]);

  // Принудительная синхронизация (для использования в хуках данных)
  const triggerSync = useCallback(async () => {
    if (!userId || !isSupabaseAvailable()) return;
    
    // Сбрасываем хеш для принудительной синхронизации
    setInternalState(prev => ({ ...prev, lastProcessedHash: null }));
    
    // Запускаем синхронизацию немедленно для новых данных
    if (needsSync(true)) {
      await syncInBackground();
    }
  }, [userId, needsSync, syncInBackground]);

  // Умная синхронизация при входе пользователя (только при необходимости)
  useEffect(() => {
    if (userId && isSupabaseAvailable()) {
      // Проверяем, была ли уже выполнена первая синхронизация
      const syncComplete = localStorage.getItem(SYNC_KEYS.syncComplete);
      if (!syncComplete) {
        setInternalState(prev => ({ ...prev, isInitialSyncComplete: false }));
      } else {
        setInternalState(prev => ({ ...prev, isInitialSyncComplete: true }));
      }
      
      // Проверяем нужна ли синхронизация
      if (needsSync()) {
        syncInBackground();
      }
    }
  }, [userId, syncInBackground, needsSync]);

  // Периодическая синхронизация каждые 2 минуты
  useEffect(() => {
    if (!userId || !isSupabaseAvailable()) return;

    const interval = setInterval(() => {
      if (needsSync()) {
        syncInBackground();
      }
    }, 2 * 60 * 1000); // 2 минуты

    return () => clearInterval(interval);
  }, [userId, needsSync, syncInBackground]);

  return {
    triggerSync,
    isSupabaseAvailable: isSupabaseAvailable(),
    deleteWishlistItem
  };
}; 