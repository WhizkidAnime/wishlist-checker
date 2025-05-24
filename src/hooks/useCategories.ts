import { useState, useMemo, useEffect } from 'react';
import { WishlistItem } from '../types/wishlistItem';

const CATEGORIES_STORAGE_KEY = 'wishlistCategories';

export const useCategories = (wishlist: WishlistItem[]) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Загружаем сохранённые категории из localStorage
  const [savedCategories, setSavedCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Сохраняем категории в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(savedCategories));
    } catch {
      // Игнорируем ошибки сохранения
    }
  }, [savedCategories]);

  // Получаем список уникальных категорий из товаров + сохранённых
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    
    // Добавляем категории из товаров
    wishlist.forEach(item => {
      if (item.category) {
        categorySet.add(item.category);
      }
    });
    
    // Добавляем сохранённые категории
    savedCategories.forEach(category => {
      categorySet.add(category);
    });
    
    return Array.from(categorySet).sort();
  }, [wishlist, savedCategories]);

  // Фильтруем товары по активной категории
  const filterByCategory = (items: WishlistItem[]) => {
    if (activeCategory === 'all') {
      // В разделе "Все" показываем только товары БЕЗ категории
      return items.filter(item => !item.category || item.category.trim() === '');
    }
    return items.filter(item => item.category === activeCategory);
  };

  // Обработчик добавления новой категории
  const handleAddCategory = (categoryName: string) => {
    const trimmedName = categoryName.trim();
    
    if (trimmedName && !categories.includes(trimmedName)) {
      // Сохраняем категорию в отдельном состоянии
      setSavedCategories(prev => [...prev, trimmedName]);
      // Переключаемся на новую категорию
      setActiveCategory(trimmedName);
    }
  };

  // Сброс на "Все" если активная категория больше не существует
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
    resetCategoryIfNeeded
  };
}; 