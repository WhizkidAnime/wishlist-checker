import React from 'react';
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

  // Подсчеты категорий не используются в заголовке — упрощаем компонент



  // Получение сводки по текущей категории больше не используется в UI,
  // оставим функцию удалённой, чтобы избежать предупреждений TypeScript.

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