import React from 'react';
import { WishlistItem } from '../types/wishlistItem';

interface ConfirmModalsProps {
  // Import modal
  isImportModalOpen: boolean;
  onImportConfirm: () => void;
  onImportCancel: () => void;
  
  // Delete modal
  isDeleteModalOpen: boolean;
  itemToDelete: WishlistItem | null;
  isDeleting?: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  
  // Toast
  showImportSuccessToast: boolean;
}

export const ConfirmModals: React.FC<ConfirmModalsProps> = ({
  isImportModalOpen,
  onImportConfirm,
  onImportCancel,
  isDeleteModalOpen,
  itemToDelete,
  isDeleting = false,
  onDeleteConfirm,
  onDeleteCancel,
  showImportSuccessToast
}) => {
  return (
    <>
      {/* Модальное окно подтверждения импорта */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div 
            className="rounded-xl shadow-xl w-full max-w-md p-6 mx-auto"
            style={{ backgroundColor: 'var(--color-card-background)' }}
          >
            <h3 className="text-lg font-semibold text-black dark:text-theme-secondary mb-2">Подтвердите действие</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Вы уверены, что хотите заменить текущий список импортированным? Это действие необратимо.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onImportCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-150 ease-in-out"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={onImportConfirm}
                className="px-4 py-1.5 border border-transparent rounded-full text-sm font-medium text-white bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none transition-colors duration-150 ease-in-out"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div 
            className="rounded-xl shadow-xl w-full max-w-md p-6 mx-auto"
            style={{ backgroundColor: 'var(--color-card-background)' }}
          >
            <h3 className="text-lg font-semibold text-black dark:text-theme-secondary mb-2">Подтвердите удаление</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Вы уверены, что хотите удалить "<span className="font-medium text-black dark:text-theme-secondary">{itemToDelete.name}</span>"? Это действие необратимо.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={onDeleteConfirm}
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
                  'Удалить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Уведомление (Toast) об успешном импорте */}
      {showImportSuccessToast && (
        <div 
          className="fixed bottom-5 left-1/2 z-50 px-4 py-2 bg-green-600 dark:bg-green-700 text-white text-sm rounded-md shadow-lg animate-fade-in-out"
          role="alert"
        >
          Список успешно импортирован!
        </div>
      )}
    </>
  );
}; 