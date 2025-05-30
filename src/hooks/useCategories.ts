import { useState, useMemo, useEffect, useCallback } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';

export const useCategories = (
  wishlist: WishlistItem[], 
  triggerSync?: () => void, 
  isAuthenticated?: boolean,
  userId?: string | null
) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [supabaseCategories, setSupabaseCategories] = useState<string[]>([]);

  // Загружаем категории из Supabase при авторизации
  const loadCategoriesFromSupabase = useCallback(async () => {
    if (!isAuthenticated || !userId || !isSupabaseAvailable() || !supabase) {
      setSupabaseCategories([]);
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
    }
  }, [isAuthenticated, userId]);

  // Загружаем категории при изменении состояния авторизации
  useEffect(() => {
    if (isAuthenticated === false) {
      // Очищаем состояние при выходе
      setSupabaseCategories([]);
      setActiveCategory('all');
    } else if (isAuthenticated === true && userId) {
      // Загружаем категории при входе
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
    
    // Добавляем категории из товаров
    wishlist.forEach(item => {
      if (item.category) {
        categorySet.add(item.category);
      }
    });
    
    // Добавляем категории из Supabase
    supabaseCategories.forEach(category => {
      categorySet.add(category);
    });
    
    return Array.from(categorySet).sort();
  }, [wishlist, supabaseCategories]);

  // Фильтруем товары по активной категории
  const filterByCategory = (items: WishlistItem[]) => {
    if (activeCategory === 'all') {
      // В разделе "Без категории" показываем только товары БЕЗ категории
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
      // Добавляем категорию в Supabase
      const { error } = await supabase
        .from('user_categories')
        .insert({
          user_id: userId,
          name: trimmedName
        });

      if (error) {
        console.error('Ошибка добавления категории в Supabase:', error);
        return;
      }

      // Обновляем локальное состояние
      setSupabaseCategories(prev => [...prev, trimmedName]);
      
      // Переключаемся на новую категорию
      setActiveCategory(trimmedName);

      // Запускаем синхронизацию если доступна
      if (triggerSync) {
        triggerSync();
      }
    } catch (error) {
      console.error('Ошибка при добавлении категории:', error);
    }
  };

  // Сброс на "Без категории" если активная категория больше не существует
  const resetCategoryIfNeeded = () => {
    if (activeCategory !== 'all' && !categories.includes(activeCategory)) {
      setActiveCategory('all');
    }
  };

  return {
    activeCategory,
    setActiveCategory,
    categories,
    filterByCategory,
    handleAddCategory,
    resetCategoryIfNeeded,
    refreshCategoriesFromStorage: loadCategoriesFromSupabase // переименовываем для совместимости
  };
}; 