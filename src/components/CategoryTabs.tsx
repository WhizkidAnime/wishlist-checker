import React, { useState } from 'react';
import { WishlistItem } from '../types/wishlistItem';

interface CategoryTabsProps {
  items: WishlistItem[];
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onAddCategory: (categoryName: string) => void;
}

export const CategoryTabs = ({ 
  items, 
  categories,
  activeCategory, 
  onCategoryChange,
  onAddCategory 
}: CategoryTabsProps) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Подсчитываем количество товаров в каждой категории
  const getCategoryCount = (category: string) => {
    if (category === 'all') {
      // В разделе "Все" считаем только товары БЕЗ категории
      return items.filter(item => !item.category || item.category.trim() === '').length;
    }
    return items.filter(item => item.category === category).length;
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    } else if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  };

  return (
    <div className="border-b border-gray-200 mb-4">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {/* Вкладка "Все" */}
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 ${
            activeCategory === 'all'
              ? 'border-gray-800 text-gray-800'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Все ({getCategoryCount('all')})
        </button>

        {/* Вкладки категорий */}
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 ${
              activeCategory === category
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {category} ({getCategoryCount(category)})
          </button>
        ))}

        {/* Кнопка добавления категории или поле ввода */}
        {isAddingCategory ? (
          <div className="flex items-center gap-2 px-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                if (!newCategoryName.trim()) {
                  setIsAddingCategory(false);
                }
              }}
              placeholder="Название категории"
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 min-w-[120px]"
              autoFocus
            />
            <button
              onClick={handleAddCategory}
              className="text-gray-500 hover:text-green-600 transition-colors duration-150"
              title="Сохранить"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 transition-colors duration-150"
            title="Добавить категорию"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}; 