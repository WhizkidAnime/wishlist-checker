import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { logger } from '../utils/logger';

export const useBulkActions = (
  userId: string | null,
  triggerSync: (force?: boolean) => Promise<{ success: boolean; message: string; }>,
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
      // Удаляем из Supabase
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .in('id', itemIds);

      if (error) {
        logger.error('Ошибка массового удаления из Supabase:', error);
        errorCount = itemIds.length;
      } else {
        deletedCount = itemIds.length;
        
        // Запускаем синхронизацию для обновления локального состояния
        await triggerSync();
        
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
  }, [userId, triggerSync, onClearBulkSelection]);

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