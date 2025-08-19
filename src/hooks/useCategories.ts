import { useState, useMemo, useEffect, useCallback } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';
import { 
  persistActiveCategoryToDB, 
  getLastActiveCategoryFromDB, 
  clearActiveCategoryFromDB 
} from '../utils/categoryPersistence';

export const useCategories = (
  wishlist: WishlistItem[], 
  triggerSync?: (force?: boolean) => Promise<{ success: boolean; message: string; }>, 
  isAuthenticated?: boolean,
  userId?: string | null
) => {
  const [activeCategory, setActiveCategoryState] = useState<string>('all');
  const [supabaseCategories, setSupabaseCategories] = useState<string[]>([]);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);
  const [hasInitialCategoriesLoaded, setHasInitialCategoriesLoaded] = useState<boolean>(false);

  // Обертка для setActiveCategory с сохранением в IndexedDB
  const setActiveCategory = useCallback((category: string) => {
    setActiveCategoryState(category);
    if (category === 'all') {
      clearActiveCategoryFromDB().catch(error => {
        console.warn('[IndexedDB] Ошибка при очистке категории (выбрана "all"):', error);
      });
    } else {
      persistActiveCategoryToDB(category).catch(error => {
        console.warn('[IndexedDB] Ошибка при сохранении категории:', error);
      });
    }
  }, []);

  // Загружаем категории из Supabase при авторизации
  const loadCategoriesFromSupabase = useCallback(async () => {
    if (!isAuthenticated || !userId || !isSupabaseAvailable() || !supabase) {
      setSupabaseCategories([]);
      setHasInitialCategoriesLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_categories')
        .select('name')
        .eq('user_id', userId);

      if (error) {
        console.error('Ошибка загрузки категорий:', error);
        return;
      }

      const categoryNames = data?.map(cat => cat.name) || [];
      setSupabaseCategories(categoryNames);
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error);
    } finally {
      setHasInitialCategoriesLoaded(true);
    }
  }, [isAuthenticated, userId]);

  // Загружаем категории при изменении состояния авторизации и очищаем состояние при выходе
  useEffect(() => {
    if (isAuthenticated === false) {
      setSupabaseCategories([]);
      setActiveCategoryState('all'); 
      setHasAttemptedRestore(false); // Сбрасываем флаг при выходе
      clearActiveCategoryFromDB().catch(error => {
        console.warn('[IndexedDB] Ошибка при очистке категории (выход):', error);
      });
      setHasInitialCategoriesLoaded(true);
    } else if (isAuthenticated === true && userId) {
      setHasInitialCategoriesLoaded(false);
      loadCategoriesFromSupabase();
    }
  }, [isAuthenticated, userId, loadCategoriesFromSupabase]);

  // Слушаем события обновления категорий
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleCategoriesUpdate = () => {
      loadCategoriesFromSupabase();
    };

    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);

    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
  }, [isAuthenticated, loadCategoriesFromSupabase]);

  // Получаем список уникальных категорий из товаров + из Supabase
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    wishlist.forEach(item => {
      if (item.category) {
        categorySet.add(item.category);
      }
    });
    supabaseCategories.forEach(category => {
      categorySet.add(category);
    });
    return Array.from(categorySet).sort();
  }, [wishlist, supabaseCategories]);

  // Восстанавливаем сохраненную категорию после загрузки списка категорий и авторизации
  useEffect(() => {
    if (isAuthenticated && categories.length > 0 && !hasAttemptedRestore) {
      setHasAttemptedRestore(true); // Устанавливаем флаг, что попытка восстановления была
      getLastActiveCategoryFromDB().then(savedCategory => {
        if (savedCategory && categories.includes(savedCategory)) {
          // Устанавливаем состояние без вызова обертки setActiveCategory,
          // чтобы избежать немедленного повторного сохранения/очистки
          setActiveCategoryState(savedCategory); 
        }
      }).catch(error => {
        console.warn('[IndexedDB] Ошибка при восстановлении категории:', error);
      });
    }
  }, [categories, isAuthenticated, hasAttemptedRestore]);

  // Фильтруем товары по активной категории
  const filterByCategory = (items: WishlistItem[]) => {
    if (activeCategory === 'all') {
      return items.filter(item => !item.category || item.category.trim() === '');
    }
    return items.filter(item => item.category === activeCategory);
  };

  // Обработчик добавления новой категории
  const handleAddCategory = async (categoryName: string) => {
    const trimmedName = categoryName.trim();
    if (!trimmedName || categories.includes(trimmedName) || !isAuthenticated || !userId) {
      return;
    }
    if (!isSupabaseAvailable() || !supabase) {
      console.error('Supabase недоступен для добавления категории');
      return;
    }
    try {
      const { error } = await supabase
        .from('user_categories')
        .insert({ user_id: userId, name: trimmedName });
      if (error) {
        console.error('Ошибка добавления категории в Supabase:', error);
        return;
      }
      setSupabaseCategories(prev => [...prev, trimmedName]);
      setActiveCategory(trimmedName); // Используем обертку для сохранения
      if (triggerSync) {
        triggerSync();
      }
    } catch (error) {
      console.error('Ошибка при добавлении категории:', error);
    }
  };

  // Обработчик удаления категории
  const handleDeleteCategory = async (categoryName: string) => {
    if (!categoryName || !isAuthenticated || !userId) {
      return { success: false, message: 'Недостаточно данных для удаления' };
    }
    if (!isSupabaseAvailable() || !supabase) {
      return { success: false, message: 'Supabase недоступен' };
    }
    try {
      const { error: updateItemsError } = await supabase
        .from('wishlist_items')
        .update({ category: null })
        .eq('user_id', userId)
        .eq('category', categoryName);
      if (updateItemsError) {
        console.error('Ошибка обновления товаров при удалении категории:', updateItemsError);
        return { success: false, message: 'Ошибка перемещения товаров в "Без категории"' };
      }
      const { error: deleteCategoryError } = await supabase
        .from('user_categories')
        .delete()
        .eq('user_id', userId)
        .eq('name', categoryName);
      if (deleteCategoryError) {
        console.error('Ошибка удаления категории из Supabase:', deleteCategoryError);
        return { success: false, message: 'Ошибка удаления категории из базы данных' };
      }
      setSupabaseCategories(prev => prev.filter(cat => cat !== categoryName));
      if (activeCategory === categoryName) {
        setActiveCategory('all'); // Используем обертку, она обработает очистку
      }
      if (triggerSync) {
        await triggerSync();
      }
      return { success: true, message: 'Категория успешно удалена, товары перемещены в "Без категории"' };
    } catch (error) {
      console.error('Ошибка при удалении категории:', error);
      return { success: false, message: 'Произошла ошибка при удалении' };
    }
  };

  // Обработчик переименования категории
  const handleRenameCategory = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || !isAuthenticated || !userId) {
      return { success: false, message: 'Некорректное имя категории' };
    }
    if (categories.includes(trimmed)) {
      return { success: false, message: 'Такая категория уже существует' };
    }
    if (!isSupabaseAvailable() || !supabase) {
      return { success: false, message: 'Supabase недоступен' };
    }
    try {
      // Обновляем имя категории в таблице категорий
      const { error: renameCatError } = await supabase
        .from('user_categories')
        .update({ name: trimmed })
        .eq('user_id', userId)
        .eq('name', oldName);
      if (renameCatError) {
        console.error('Ошибка переименования категории в Supabase:', renameCatError);
        return { success: false, message: 'Не удалось переименовать категорию' };
      }

      // Обновляем связанные товары
      const { error: updateItemsError } = await supabase
        .from('wishlist_items')
        .update({ category: trimmed })
        .eq('user_id', userId)
        .eq('category', oldName);
      if (updateItemsError) {
        console.error('Ошибка обновления товаров при переименовании:', updateItemsError);
        return { success: false, message: 'Категория переименована, но товары не обновлены' };
      }

      // Локально заменяем имя
      setSupabaseCategories(prev => prev.map(c => (c === oldName ? trimmed : c)));
      if (activeCategory === oldName) {
        setActiveCategory(trimmed);
      }
      if (triggerSync) {
        await triggerSync();
      }
      return { success: true, message: 'Категория переименована' };
    } catch (error) {
      console.error('Критическая ошибка при переименовании категории:', error);
      return { success: false, message: 'Произошла ошибка при переименовании' };
    }
  };

  // Сброс на "Без категории" если активная категория больше не существует
  const resetCategoryIfNeeded = () => {
    if (activeCategory !== 'all' && !categories.includes(activeCategory)) {
      setActiveCategory('all'); // Используем обертку, она обработает очистку
    }
  };

  return {
    activeCategory,
    setActiveCategory,
    categories,
    filterByCategory,
    handleAddCategory,
    handleDeleteCategory,
    handleRenameCategory,
    resetCategoryIfNeeded,
    refreshCategoriesFromStorage: loadCategoriesFromSupabase,
    hasInitialCategoriesLoaded
  };
}; 