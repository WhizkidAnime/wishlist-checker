import { useState, useCallback } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { supabase } from '../utils/supabaseClient';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorageUtils';
import { logger } from '../utils/logger';

const WISHLIST_STORAGE_KEY = 'wishlistApp';

export const useBulkActions = (
  userId: string | null,
  triggerSync: () => Promise<void>,
  onClearBulkSelection: () => void
) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // Массовое удаление товаров
  const bulkDeleteItems = useCallback(async (itemIds: (string | number)[]): Promise<{ success: boolean; deletedCount: number; errorCount: number }> => {
    if (!userId || !supabase || itemIds.length === 0) {
      return { success: false, deletedCount: 0, errorCount: itemIds.length };
    }

    setIsDeleting(true);
    let deletedCount = 0;
    let errorCount = 0;

    try {
      // Сначала обновляем localStorage для немедленного обновления UI
      const currentItems: WishlistItem[] = loadFromLocalStorage(WISHLIST_STORAGE_KEY) || [];
      const itemsToDelete = currentItems.filter(item => itemIds.includes(item.id));
      const updatedItems = currentItems.filter(item => !itemIds.includes(item.id));
      saveToLocalStorage(WISHLIST_STORAGE_KEY, updatedItems);

      // Уведомляем об обновлении данных
      window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));

      // Затем удаляем из Supabase
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .in('id', itemIds);

      if (error) {
        logger.error('Ошибка массового удаления из Supabase:', error);
        // Восстанавливаем элементы в localStorage при ошибке
        const restoredItems = [...updatedItems, ...itemsToDelete];
        saveToLocalStorage(WISHLIST_STORAGE_KEY, restoredItems);
        window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));
        errorCount = itemIds.length;
      } else {
        deletedCount = itemIds.length;
        // Очищаем выбор
        onClearBulkSelection();
      }
    } catch (error) {
      logger.error('Критическая ошибка при массовом удалении:', error);
      errorCount = itemIds.length;
    } finally {
      setIsDeleting(false);
    }

    return { 
      success: deletedCount > 0, 
      deletedCount, 
      errorCount 
    };
  }, [userId, onClearBulkSelection]);

  // Массовое перемещение товаров в категорию
  const bulkMoveToCategory = useCallback(async (
    itemIds: (string | number)[], 
    categoryName: string | null
  ): Promise<{ success: boolean; movedCount: number; errorCount: number }> => {
    if (!userId || !supabase || itemIds.length === 0) {
      return { success: false, movedCount: 0, errorCount: itemIds.length };
    }

    setIsMoving(true);
    let movedCount = 0;
    let errorCount = 0;

    try {
      // Обновляем в Supabase
      const { error } = await supabase
        .from('wishlist_items')
        .update({ category: categoryName })
        .in('id', itemIds);

      if (error) {
        logger.error('Ошибка массового перемещения в Supabase:', error);
        errorCount = itemIds.length;
      } else {
        movedCount = itemIds.length;

        // Обновляем localStorage
        const currentItems: WishlistItem[] = loadFromLocalStorage(WISHLIST_STORAGE_KEY) || [];
        const updatedItems = currentItems.map(item => 
          itemIds.includes(item.id) 
            ? { ...item, category: categoryName || undefined }
            : item
        );
        saveToLocalStorage(WISHLIST_STORAGE_KEY, updatedItems);

        // Уведомляем об обновлении данных
        window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));

        // Запускаем синхронизацию
        await triggerSync();

        // Очищаем выбор
        onClearBulkSelection();
      }
    } catch (error) {
      logger.error('Критическая ошибка при массовом перемещении:', error);
      errorCount = itemIds.length;
    } finally {
      setIsMoving(false);
    }

    return { 
      success: movedCount > 0, 
      movedCount, 
      errorCount 
    };
  }, [userId, triggerSync, onClearBulkSelection]);

  return {
    bulkDeleteItems,
    bulkMoveToCategory,
    isDeleting,
    isMoving
  };
}; 