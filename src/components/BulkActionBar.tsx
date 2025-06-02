import React, { useState } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { DesktopOnlyTooltip } from './ui/DesktopOnlyTooltip';

interface BulkActionBarProps {
  selectedItems: WishlistItem[];
  categories: string[];
  isDeleting: boolean;
  isMoving: boolean;
  onDelete: () => void;
  onMoveToCategory: (categoryName: string | null) => void;
  onClearSelection: () => void;
  isMobile: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedItems,
  categories,
  isDeleting,
  isMoving,
  onDelete,
  onMoveToCategory,
  onClearSelection,
  isMobile
}) => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const selectedCount = selectedItems.length;

  if (selectedCount === 0) return null;

  const handleMoveToCategory = (categoryName: string | null) => {
    onMoveToCategory(categoryName);
    setShowCategoryDropdown(false);
  };

  return (
    <>
      {/* Backdrop для закрытия dropdown */}
      {showCategoryDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowCategoryDropdown(false)}
        />
      )}
      
      {/* Floating Action Bar */}
      <div 
        className={`fixed z-40 transition-all duration-300 ease-out animate-in slide-in-from-bottom-full ${
          isMobile 
            ? 'bottom-4 left-4 right-4' 
            : 'bottom-8 left-1/2 transform -translate-x-1/2'
        }`}
      >
        <div 
          className={`rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 ${
            isMobile ? 'p-4' : 'p-3 px-6'
          }`}
          style={{ backgroundColor: 'var(--color-card-background)' }}
        >
          <div className={`flex items-center gap-4 ${isMobile ? 'flex-col' : ''}`}>
            {/* Информация о выборе */}
            <div className="flex-shrink-0 text-center">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Выбрано: {selectedCount}
              </div>
            </div>

            {/* Действия */}
            <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
              {/* Кнопка удаления */}
              <DesktopOnlyTooltip content="Удалить выбранные товары">
                <button
                  onClick={onDelete}
                  disabled={isDeleting || isMoving}
                  className={`${
                    isMobile ? 'flex-1' : ''
                  } px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isMobile ? 'Удаление...' : '...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {isMobile ? 'Удалить' : 'Удалить'}
                    </>
                  )}
                </button>
              </DesktopOnlyTooltip>

              {/* Кнопка перемещения в категорию */}
              <div className={`relative ${isMobile ? 'flex-1' : ''}`}>
                <DesktopOnlyTooltip content="Переместить выбранные товары в другую категорию">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    disabled={isDeleting || isMoving}
                    className={`${
                      isMobile ? 'w-full' : ''
                    } px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isMoving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
                        {isMobile ? 'Перемещение...' : '...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        {isMobile ? 'Переместить' : 'В категорию'}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </DesktopOnlyTooltip>

                {/* Dropdown меню категорий */}
                {showCategoryDropdown && (
                  <div 
                    className={`absolute rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-48 w-auto animate-in fade-in-0 zoom-in-95 ${
                      isMobile ? 'left-0 right-0 bottom-full mb-2' : 'bottom-full mb-2 left-0'
                    }`}
                    style={{ backgroundColor: 'var(--color-card-background)' }}
                  >
                    {/* Контейнер с ограниченной высотой и скроллингом */}
                    <div className="max-h-52 overflow-y-auto scrollbar-hide py-1 flex flex-col">
                      {/* Без категории */}
                      <button
                        onClick={() => handleMoveToCategory(null)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap block"
                      >
                        Без категории
                      </button>
                      
                      {/* Существующие категории */}
                      {categories.length > 0 && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                          {categories.map((category) => (
                            <button
                              key={category}
                              onClick={() => handleMoveToCategory(category)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap block"
                            >
                              {category}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Кнопка отмены */}
              <DesktopOnlyTooltip content="Отменить выбор всех товаров">
                <button
                  onClick={onClearSelection}
                  disabled={isDeleting || isMoving}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </DesktopOnlyTooltip>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 