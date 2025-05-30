import { supabase, isSupabaseAvailable } from './supabaseClient';

/**
 * Полная очистка всех данных пользователя из Supabase
 */
export const clearAllUserData = async (userId: string): Promise<boolean> => {
  if (!userId || !isSupabaseAvailable() || !supabase) {
    console.error('❌ Невозможно очистить данные: нет Supabase подключения или userId');
    return false;
  }

  try {
    console.log('🧹 Начинаем полную очистку данных пользователя...');

    // 1. Удаляем все товары из wishlist_items
    const { error: wishlistError } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId);

    if (wishlistError) {
      console.error('❌ Ошибка удаления товаров:', wishlistError);
      throw wishlistError;
    }

    // 2. Удаляем все категории из user_categories
    const { error: categoriesError } = await supabase
      .from('user_categories')
      .delete()
      .eq('user_id', userId);

    if (categoriesError) {
      console.error('❌ Ошибка удаления категорий:', categoriesError);
      throw categoriesError;
    }

    // 3. Удаляем пользовательские настройки из user_preferences
    const { error: settingsError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (settingsError) {
      console.error('❌ Ошибка удаления настроек:', settingsError);
      throw settingsError;
    }

    // 4. Уведомляем компоненты об обновлении
    window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));

    console.log('✅ Все данные пользователя успешно очищены из Supabase');
    return true;

  } catch (error) {
    console.error('❌ Ошибка при полной очистке данных:', error);
    return false;
  }
};

/**
 * Проверка состояния данных пользователя в Supabase
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

    const state = {
      supabase: {
        wishlistCount: wishlistResult.data?.length || 0,
        categoriesCount: categoriesResult.data?.length || 0
      }
    };

    console.log('📊 Состояние данных пользователя:', state);
    return state;

  } catch (error) {
    console.error('❌ Ошибка проверки состояния данных:', error);
    return null;
  }
}; 