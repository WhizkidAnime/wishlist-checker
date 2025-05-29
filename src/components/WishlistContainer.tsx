import { WishlistItem } from './WishlistItem';
import { WishlistItem as WishlistItemType } from '../types/wishlistItem';

/**
 * Компонент-контейнер для отображения всего списка желаний
 */
interface WishlistContainerProps {
  wishlistItems: WishlistItemType[];
  onToggleBought: (id: string | number) => void;
  onDeleteItem: (id: string | number) => void;
  onUpdateItem: (updatedItem: WishlistItemType) => void;
  editingItemId: string | number | null;
  onEditClick: (id: string | number) => void;
  onCancelEdit: () => void;
  displayCurrency: string;
  exchangeRates: Record<string, number>;
  onCurrencyChange: (currency: string) => void;
  selectedItemIds: (string | number)[];
  onToggleSelected: (id: string | number) => void;
  bulkSelectedItemIds: (string | number)[];
  onToggleBulkSelected: (id: string | number) => void;
  isMobile: boolean;
  onMoveItem: (id: string | number, direction: 'up' | 'down') => void;
}

export const WishlistContainer = ({ 
  wishlistItems, 
  onToggleBought, 
  onDeleteItem, 
  onUpdateItem, 
  editingItemId, 
  onEditClick, 
  onCancelEdit, 
  displayCurrency, 
  exchangeRates,
  onCurrencyChange,
  selectedItemIds,
  onToggleSelected,
  bulkSelectedItemIds,
  onToggleBulkSelected,
  isMobile,
  onMoveItem
}: WishlistContainerProps) => {
  return (
    <div className="mb-8 sm:mb-10">
      <div className="mb-4">
        <div className="flex items-baseline">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mr-4">Список желаний</h2>
          
          <div className="flex items-center mr-4">
            <span className="text-sm text-gray-500 mr-2">Валюта:</span>
            <select 
              id="currency-select"
              value={displayCurrency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="text-sm bg-gray-100 border-0 rounded-md px-2 py-1 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="RUB">RUB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            {wishlistItems.length} {getItemsCountText(wishlistItems.length)}
          </div>
        </div>
      </div>
      
      {wishlistItems.length > 0 ? (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          {wishlistItems.map((item, index) => (
            <WishlistItem 
              key={item.id} 
              item={item} 
              onToggleBought={onToggleBought} 
              onDeleteItem={onDeleteItem} 
              onUpdateItem={onUpdateItem}
              isEditing={editingItemId === item.id}
              onEditClick={onEditClick}
              onCancelEdit={onCancelEdit}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates}
              isSelected={selectedItemIds.includes(item.id)}
              onToggleSelected={onToggleSelected}
              isBulkSelected={bulkSelectedItemIds.includes(item.id)}
              onToggleBulkSelected={onToggleBulkSelected}
              isMobile={isMobile}
              onMoveItem={onMoveItem}
              index={index}
              totalItems={wishlistItems.length}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-center py-8">Ваш список желаний пуст. Добавьте свои первые желания!</p>
        </div>
      )}
    </div>
  );
};

/**
 * Вспомогательная функция для правильного склонения слова "элемент"
 */
function getItemsCountText(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'элементов';
  }
  
  if (lastDigit === 1) {
    return 'элемент';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'элемента';
  }
  
  return 'элементов';
}