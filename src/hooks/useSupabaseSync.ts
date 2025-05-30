import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';

// Упрощенное состояние только для внутреннего использования
interface InternalSyncState {
  isProcessing: boolean;
  lastSyncTime: number;
}

// Минимальный интервал между синхронизациями (5 секунд)
const MIN_SYNC_INTERVAL = 5000;

export const useSupabaseSync = (userId: string | null) => {
  const [internalState, setInternalState] = useState<InternalSyncState>({
    isProcessing: false,
    lastSyncTime: 0
  });

  // Функция для уведомления об обновлении данных
  const notifyDataUpdated = useCallback(() => {
    window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));
  }, []);

  // Проверка необходимости синхронизации
  const needsSync = useCallback((forcedCheck = false) => {
    if (!userId || !isSupabaseAvailable()) return false;

    // Для принудительной проверки пропускаем временные ограничения
    if (!forcedCheck) {
      const now = Date.now();
      if (now - internalState.lastSyncTime < MIN_SYNC_INTERVAL) {
        return false;
      }
    }

    return true;
  }, [userId, internalState.lastSyncTime]);

  // Синхронизация товаров с Supabase
  const syncWishlistItems = useCallback(async (userId: string) => {
    if (!isSupabaseAvailable() || !supabase) return false;

    try {
      // Получаем актуальные данные из Supabase
      const { error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Уведомляем компоненты об обновлении
      notifyDataUpdated();
      
      return true;

    } catch (error) {
      console.error('❌ Ошибка синхронизации товаров:', error);
      return false;
    }
  }, [notifyDataUpdated]);

  // Синхронизация категорий с Supabase
  const syncCategories = useCallback(async (userId: string) => {
    if (!isSupabaseAvailable() || !supabase) return false;

    try {
      // Получаем актуальные категории из Supabase
      const { error } = await supabase
        .from('user_categories')
        .select('name, user_id')
        .eq('user_id', userId);

      if (error) throw error;

      // Уведомляем компоненты об обновлении
      notifyDataUpdated();
      
      return true;

    } catch (error) {
      console.error('❌ Ошибка синхронизации категорий:', error);
      return false;
    }
  }, [notifyDataUpdated]);

  // Основная функция синхронизации
  const triggerSync = useCallback(async (force = false) => {
    if (!userId || internalState.isProcessing) {
      return { success: false, message: 'Синхронизация недоступна' };
    }

    if (!needsSync(force)) {
      return { success: true, message: 'Синхронизация не требуется' };
    }

    setInternalState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Выполняем синхронизацию только товаров и категорий (без темы)
      const [wishlistSuccess, categoriesSuccess] = await Promise.all([
        syncWishlistItems(userId),
        syncCategories(userId)
      ]);

      const allSuccess = wishlistSuccess && categoriesSuccess;

      if (allSuccess) {
        // Обновляем время последней синхронизации
        setInternalState(prev => ({ 
          ...prev, 
          lastSyncTime: Date.now()
        }));
        
        return { success: true, message: 'Синхронизация завершена успешно' };
      } else {
        console.warn('⚠️ Синхронизация завершена с ошибками');
        return { success: false, message: 'Синхронизация завершена с ошибками' };
      }

    } catch (error) {
      console.error('❌ Критическая ошибка синхронизации:', error);
      return { success: false, message: 'Критическая ошибка синхронизации' };
    } finally {
      setInternalState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [userId, internalState.isProcessing, needsSync, syncWishlistItems, syncCategories]);

  // Автоматическая синхронизация при изменении userId
  useEffect(() => {
    if (userId && isSupabaseAvailable()) {
      // Небольшая задержка для избежания множественных вызовов
      const timer = setTimeout(() => {
        triggerSync(true); // Принудительная синхронизация при входе
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [userId, triggerSync]);

  // Периодическая синхронизация каждые 5 минут
  useEffect(() => {
    if (!userId || !isSupabaseAvailable()) return;

    const interval = setInterval(() => {
      if (!internalState.isProcessing) {
        triggerSync();
      }
    }, 5 * 60 * 1000); // 5 минут вместо 30 секунд

    return () => clearInterval(interval);
  }, [userId, triggerSync, internalState.isProcessing]);

  return {
    triggerSync,
    isProcessing: internalState.isProcessing
  };
}; 