import { useState, useEffect, useCallback } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorageUtils';
import { logger } from '../utils/logger';

// Упрощенное состояние только для внутреннего использования
interface InternalSyncState {
  isProcessing: boolean;
  lastProcessedHash: string | null;
}

const SYNC_KEYS = {
  wishlist: 'wishlistApp',
  categories: 'wishlistCategories',
  theme: 'wishlist-theme-mode',
  lastModified: 'wishlist-last-modified',
  dataHash: 'wishlist-data-hash'
} as const;

// Минимальный интервал между синхронизациями (5 секунд)
const MIN_SYNC_INTERVAL = 5000;
let lastSyncTime = 0;

export const useSupabaseSync = (userId: string | null) => {
  const [internalState, setInternalState] = useState<InternalSyncState>({
    isProcessing: false,
    lastProcessedHash: null
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

  // Синхронизация товаров
  const syncWishlistItems = useCallback(async (userId: string) => {
    if (!isSupabaseAvailable() || !supabase) return false;

    try {
      const localItems: WishlistItem[] = loadFromLocalStorage(SYNC_KEYS.wishlist) || [];

      // Получаем существующие элементы из базы
      const { data: remoteItems, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 🔍 ДИАГНОСТИКА: Логируем что получили из базы
      console.log('🔍 ДИАГНОСТИКА syncWishlistItems:');
      console.log('📊 userId:', userId);
      console.log('📊 remoteItems count:', remoteItems?.length || 0);
      console.log('📊 localItems count:', localItems.length);
      if (remoteItems && remoteItems.length > 0) {
        console.log('📊 Первые 3 элемента из базы:', remoteItems.slice(0, 3).map(item => ({
          id: item.id,
          name: item.name,
          user_id: item.user_id
        })));
      }

      // 🚨 КРИТИЧЕСКИ ВАЖНО: Дополнительная фильтрация в коде!
      // На случай если RLS policies не работают в Supabase
      const safeRemoteItems = remoteItems?.filter(item => item.user_id === userId) || [];
      
      console.log('🔒 БЕЗОПАСНОСТЬ: После фильтрации по user_id:', safeRemoteItems.length);
      if (safeRemoteItems.length !== (remoteItems?.length || 0)) {
        console.error('🚨 КРИТИЧЕСКАЯ ОШИБКА: RLS policies НЕ РАБОТАЮТ! Обнаружены данные других пользователей!');
        console.error('📊 Исходное количество:', remoteItems?.length || 0);
        console.error('📊 После фильтрации:', safeRemoteItems.length);
      }

      const remoteIds = new Set(safeRemoteItems.map(item => item.id));
      
      // Если есть удаленные элементы и локальные данные
      if (safeRemoteItems && safeRemoteItems.length > 0 && localItems.length === 0) {
        // Первая загрузка - берём данные из облака
        const convertedItems = safeRemoteItems.map(convertFromSupabaseItem);
        saveToLocalStorage(SYNC_KEYS.wishlist, convertedItems);
        notifyDataUpdated();
        logger.sync(`Загружено ${convertedItems.length} товаров из облака`);
        return true;
      } else if (localItems.length > 0) {
        // Есть локальные данные - синхронизируем изменения
        const newItems = localItems.filter(item => !remoteIds.has(item.id));
        
        if (newItems.length > 0) {
          // Добавляем новые элементы
          const supabaseItems = newItems.map(item => convertToSupabaseItem(item, userId));
          
          const { error: insertError } = await supabase
            .from('wishlist_items')
            .insert(supabaseItems);

          if (insertError) throw insertError;
          logger.sync(`Добавлено ${newItems.length} новых товаров в облако`);
        }
        
        // Проверяем обновления существующих элементов
        const existingItems = localItems.filter(item => remoteIds.has(item.id));
        for (const localItem of existingItems) {
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
            }
          }
        }
        
        return newItems.length > 0;
      }

      return false;
    } catch (error) {
      logger.sync('Ошибка синхронизации товаров:', error);
      return false;
    }
  }, [notifyDataUpdated]);

  // Синхронизация категорий
  const syncCategories = useCallback(async (userId: string) => {
    if (!isSupabaseAvailable() || !supabase) return false;

    try {
      const localCategories: string[] = loadFromLocalStorage(SYNC_KEYS.categories) || [];

      const { data: remoteCategories, error } = await supabase
        .from('user_categories')
        .select('name, user_id')
        .eq('user_id', userId);

      if (error) throw error;

      // 🚨 КРИТИЧЕСКИ ВАЖНО: Дополнительная фильтрация категорий в коде!
      // На случай если RLS policies не работают в Supabase  
      const safeCategoriesData = remoteCategories?.filter((cat: any) => cat.user_id === userId) || [];
      console.log('🔒 БЕЗОПАСНОСТЬ категорий: После фильтрации по user_id:', safeCategoriesData.length);
      
      if (safeCategoriesData.length !== (remoteCategories?.length || 0)) {
        console.error('🚨 КРИТИЧЕСКАЯ ОШИБКА: RLS для категорий НЕ РАБОТАЕТ!');
      }

      if (safeCategoriesData && safeCategoriesData.length > 0) {
        const categoryNames = safeCategoriesData.map((cat: { name: string }) => cat.name);
        saveToLocalStorage(SYNC_KEYS.categories, categoryNames);
        notifyDataUpdated();
        logger.sync(`Загружено ${categoryNames.length} категорий из облака`);
        return true;
      } else if (localCategories.length > 0) {
        const categoriesToInsert = localCategories.map(name => ({
          user_id: userId,
          name
        }));

        const { error: insertError } = await supabase
          .from('user_categories')
          .insert(categoriesToInsert);

        if (insertError) throw insertError;

        logger.sync(`Загружено ${localCategories.length} категорий в облако`);
        return true;
      }

      return false;
    } catch (error) {
      logger.sync('Ошибка синхронизации категорий:', error);
      return false;
    }
  }, [notifyDataUpdated]);

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
    // 🚨 ВРЕМЕННО ОТКЛЮЧЕНО: Предотвращение загрузки чужих данных
    console.log('🔴 СИНХРОНИЗАЦИЯ ВРЕМЕННО ОТКЛЮЧЕНА: RLS policies не работают');
    return;
    
    if (userId && isSupabaseAvailable()) {
      // Проверяем нужна ли синхронизация
      if (needsSync()) {
        syncInBackground();
      }
    }
  }, [userId, syncInBackground, needsSync]);

  return {
    triggerSync,
    isSupabaseAvailable: isSupabaseAvailable()
  };
}; 