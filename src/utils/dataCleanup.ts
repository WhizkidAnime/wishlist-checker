import { supabase, isSupabaseAvailable } from './supabaseClient';
import { logger } from './logger';

/**
 * Полная очистка всех пользовательских данных
 * Используется для решения проблем с синхронизацией
 */
export const clearAllUserData = async (userId: string): Promise<boolean> => {
  if (!userId || !isSupabaseAvailable() || !supabase) {
    logger.sync('Невозможно очистить данные: нет соединения с Supabase');
    return false;
  }

  try {
    console.log('🧹 Начинаем полную очистку данных пользователя...');

    // 1. Удаляем все элементы wishlist из Supabase
    const { error: wishlistError } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId);

    if (wishlistError) {
      console.error('❌ Ошибка удаления wishlist из Supabase:', wishlistError);
      throw wishlistError;
    }

    // 2. Удаляем все категории из Supabase
    const { error: categoriesError } = await supabase
      .from('user_categories')
      .delete()
      .eq('user_id', userId);

    if (categoriesError) {
      console.error('❌ Ошибка удаления категорий из Supabase:', categoriesError);
      throw categoriesError;
    }

    // 3. Сбрасываем настройки пользователя (тему оставляем)
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .update({ 
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (preferencesError) {
      console.warn('⚠️ Не удалось обновить настройки пользователя:', preferencesError);
    }

    // 4. Очищаем localStorage
    localStorage.removeItem('wishlistApp');
    localStorage.removeItem('wishlistCategories');
    
    // 5. Очищаем все sync данные
    localStorage.removeItem('wishlist-last-modified');
    localStorage.removeItem('wishlist-data-hash');
    localStorage.removeItem('wishlist-sync-state');

    // 6. Уведомляем компоненты об обновлении
    window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));

    console.log('✅ Все данные пользователя успешно очищены');
    return true;

  } catch (error) {
    console.error('❌ Ошибка при полной очистке данных:', error);
    return false;
  }
};

/**
 * Проверка состояния данных пользователя
 */
export const checkUserDataState = async (userId: string) => {
  if (!userId || !isSupabaseAvailable() || !supabase) {
    return null;
  }

  try {
    // Проверяем данные в Supabase
    const [wishlistResult, categoriesResult] = await Promise.all([
      supabase.from('wishlist_items').select('id').eq('user_id', userId),
      supabase.from('user_categories').select('id').eq('user_id', userId)
    ]);

    // Проверяем данные в localStorage
    const localWishlist = JSON.parse(localStorage.getItem('wishlistApp') || '[]');
    const localCategories = JSON.parse(localStorage.getItem('wishlistCategories') || '[]');

    const state = {
      supabase: {
        wishlistCount: wishlistResult.data?.length || 0,
        categoriesCount: categoriesResult.data?.length || 0
      },
      localStorage: {
        wishlistCount: localWishlist.length,
        categoriesCount: localCategories.length
      }
    };

    console.log('📊 Состояние данных пользователя:', state);
    return state;

  } catch (error) {
    console.error('❌ Ошибка проверки состояния данных:', error);
    return null;
  }
}; 