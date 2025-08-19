import React, { useMemo } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { CategorySidebar } from './CategorySidebar';

interface CategoryTabsProps {
  items: WishlistItem[];
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onAddCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => Promise<{ success: boolean; message: string } | void> | void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const CategoryTabsComponent = ({ 
  items, 
  categories,
  activeCategory,
  onCategoryChange,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  isSidebarOpen,
  setIsSidebarOpen
}: CategoryTabsProps) => {

  // Подсчитываем количество товаров в каждой категории (мемоизировано)
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    let nocat = 0;
    for (const it of items) {
      const cat = (it.category || '').trim();
      if (!cat) nocat += 1; else map.set(cat, (map.get(cat) || 0) + 1);
    }
    return { map, nocat };
  }, [items]);
  const getCategoryCount = (category: string) => {
    if (category === 'all') return counts.nocat;
    return counts.map.get(category) || 0;
  };



  // Получаем информацию о текущей активной категории для отображения
  const getCurrentCategoryInfo = () => {
    if (activeCategory === 'all') {
      return {
        name: 'Без категории',
        count: getCategoryCount('all')
      };
    }
    return {
      name: activeCategory,
      count: getCategoryCount(activeCategory)
    };
  };

  const currentCategory = getCurrentCategoryInfo();

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        {/* Кнопка категорий */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="px-3 py-1.5 rounded-full text-sm font-semibold bg-theme-button text-theme-button hover:bg-theme-button focus:outline-none transition-colors duration-150 ease-in-out"
        >
          Категории
        </button>

        {/* Правая часть пустая (ранее был индикатор фильтра) */}
      </div>

      {/* Боковая панель категорий */}
      <CategorySidebar
        items={items}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
        onRenameCategory={onRenameCategory}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
};

export const CategoryTabs = React.memo(CategoryTabsComponent);