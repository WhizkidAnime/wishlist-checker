import { WishlistItem } from '../types/wishlistItem';

interface BulkDeleteModalProps {
  isOpen: boolean;
  selectedItems: WishlistItem[];
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  selectedItems,
  isDeleting,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const itemCount = selectedItems.length;
  const totalValue = selectedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-2xl p-6 max-w-md w-full shadow-xl"
        style={{ backgroundColor: 'var(--color-card-background)' }}
      >
        <div className="text-center">
          {/* Иконка предупреждения */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          {/* Заголовок */}
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Удалить выбранные товары?
          </h3>

          {/* Описание */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 space-y-1">
            <p>
              Будет удалено <span className="font-medium text-gray-700 dark:text-gray-300">{itemCount}</span>{' '}
              {itemCount === 1 ? 'товар' : itemCount < 5 ? 'товара' : 'товаров'}
            </p>
            <p>
              На общую сумму <span className="font-medium text-gray-700 dark:text-gray-300">{totalValue.toLocaleString()} RUB</span>
            </p>
            <p className="text-red-500 dark:text-red-400 font-medium mt-2">
              Это действие нельзя отменить
            </p>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 