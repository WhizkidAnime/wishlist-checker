import React from 'react';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  categoryName: string;
  itemsCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  isOpen,
  categoryName,
  itemsCount,
  isDeleting,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div 
        className="rounded-xl shadow-xl w-full max-w-md p-6 mx-auto"
        style={{ backgroundColor: 'var(--color-card-background)' }}
      >
        <h3 className="text-lg font-semibold text-black dark:text-theme-secondary mb-2">
          Удалить категорию
        </h3>
        <div className="text-gray-600 dark:text-gray-400 mb-4">
          <p className="mb-2">
            Вы уверены, что хотите удалить категорию{' '}
            <span className="font-medium text-black dark:text-theme-secondary">"{categoryName}"</span>?
          </p>
          {itemsCount > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              ⚠️ В этой категории {itemsCount} {itemsCount === 1 ? 'товар' : itemsCount < 5 ? 'товара' : 'товаров'}. 
              После удаления категории все товары останутся, но будут перемещены в раздел "Без категории".
            </p>
          )}
          <p className="text-sm mt-2">Это действие необратимо.</p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-1.5 border border-transparent rounded-full text-sm font-medium text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Удаление...
              </>
            ) : (
              'Удалить категорию'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 