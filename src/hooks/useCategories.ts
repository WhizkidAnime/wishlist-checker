import { useState, useMemo, useEffect } from 'react';
import { WishlistItem } from '../types/wishlistItem';

const CATEGORIES_STORAGE_KEY = 'wishlistCategories';

export const useCategories = (wishlist: WishlistItem[], triggerSync?: () => void, isAuthenticated?: boolean) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Загружаем сохранённые категории из localStorage только для аутентифицированных
  const [savedCategories, setSavedCategories] = useState<string[]>(() => {
    if (!isAuthenticated) return [];
    
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Эффект для очистки категорий при выходе из аккаунта
  useEffect(() => {
    if (isAuthenticated === false) {
      // Очищаем состояние при выходе
      setSavedCategories([]);
      setActiveCategory('all');
    } else if (isAuthenticated === true) {
      // Загружаем категории при входе
      try {
        const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        const parsedCategories = saved ? JSON.parse(saved) : [];
        setSavedCategories(parsedCategories);
      } catch {
        setSavedCategories([]);
      }
    }
  }, [isAuthenticated]);

  // Функция для обновления категорий из localStorage
  const refreshCategoriesFromStorage = () => {
    if (!isAuthenticated) {
      setSavedCategories([]);
      return;
    }

    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      const parsedCategories = saved ? JSON.parse(saved) : [];
      setSavedCategories(parsedCategories);
    } catch {
      setSavedCategories([]);
    }
  };

  // Сохраняем категории в localStorage при изменении (только для аутентифицированных)
  useEffect(() => {
    if (!isAuthenticated) return;

    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(savedCategories));
      // Автоматически запускаем синхронизацию при изменениях
      if (triggerSync) {
        triggerSync();
      }
    } catch {
      // Игнорируем ошибки сохранения
    }
  }, [savedCategories, triggerSync, isAuthenticated]);

  // Слушаем изменения localStorage для синхронизации после импорта (только для аутентифицированных)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CATEGORIES_STORAGE_KEY) {
        refreshCategoriesFromStorage();
      }
    };

    // Также слушаем кастомное событие для принудительного обновления
    const handleCustomUpdate = () => {
      refreshCategoriesFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('categoriesUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('categoriesUpdated', handleCustomUpdate);
    };
  }, [isAuthenticated]);

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
    resetCategoryIfNeeded,
    refreshCategoriesFromStorage
  };
}; 