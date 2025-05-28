import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef } from 'react';

import { WishlistItem as WishlistItemType } from '../types/wishlistItem';
import { EditItemForm } from './EditItemForm';

// Функция для форматирования URL (добавляет протокол, если отсутствует)
const formatUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

interface WishlistItemProps {
  item: WishlistItemType;
  onToggleBought: (id: string | number) => void;
  onDeleteItem: (id: string | number) => void;
  onUpdateItem: (updatedItem: WishlistItemType) => void;
  isEditing: boolean;
  onEditClick: (id: string | number) => void;
  onCancelEdit: () => void;
  displayCurrency: string;
  exchangeRates: Record<string, number>;
  isSelected: boolean;
  onToggleSelected: (id: string | number, buttonElement?: HTMLElement) => void;
  isMobile: boolean;
  onMoveItem: (id: string | number, direction: 'up' | 'down') => void;
  index: number;
  totalItems: number;
  comment?: string;
  existingCategories?: string[];
}

/**
 * Компонент для отображения одного элемента вишлиста
 */
export const WishlistItem = ({ 
  item, 
  onToggleBought, 
  onDeleteItem, 
  onUpdateItem, 
  isEditing, 
  onEditClick, 
  onCancelEdit, 
  displayCurrency, 
  exchangeRates,
  isSelected,
  onToggleSelected,
  isMobile,
  onMoveItem,
  index,
  totalItems,
  comment,
  existingCategories
}: WishlistItemProps) => {

  const { 
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, disabled: isMobile });

  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const desktopButtonRef = useRef<HTMLButtonElement>(null);

  // Определяем прозрачность: 0.5 если перетаскивается, 
  // иначе 0.6 если куплено, иначе 1
  const itemOpacity = isDragging ? 0.5 : (item.isBought ? 0.6 : 1);

  const style = !isMobile ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: itemOpacity, // Используем вычисленную прозрачность
    zIndex: isDragging ? 10 : 'auto',
  } : { // Для мобильной версии тоже применим прозрачность через style
    opacity: itemOpacity,
    // transition: 'opacity 0.2s ease-in-out' // Можно добавить transition
  };

  if (isEditing) {
    return <EditItemForm item={item} onUpdateItem={onUpdateItem} onCancel={onCancelEdit} existingCategories={existingCategories} />;
  }
  
  if (isMobile) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0 px-3 py-2 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-white dark:bg-gray-800'}`}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <button
                ref={mobileButtonRef}
                onClick={() => onToggleSelected(item.id, mobileButtonRef.current || undefined)}
                className={`h-5 w-5 rounded-full p-0.5 border flex items-center justify-center focus:outline-none transition-colors touch-manipulation ${
                  isSelected ? 'bg-gray-900 dark:bg-gray-600 border-gray-900 dark:border-gray-600 text-white' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                style={{ touchAction: 'manipulation' }}
                title={isSelected ? "Убрать из расчета" : "Добавить в расчет"} aria-label={isSelected ? "Убрать из расчета" : "Добавить в расчет"}
              >
                {isSelected ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                )}
              </button>
            </div>
            <div className="flex-grow min-w-0">
              <div className="font-medium text-gray-800 dark:text-gray-200 break-words">
                {item.link ? (
                  <a href={formatUrl(item.link)} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 underline hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors duration-150">{item.name}</a>
                ) : (
                  <span>{item.name}</span>
                )}
              </div>
              {item.itemType && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {item.itemType}
                </div>
              )}
              {comment && (
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 break-words">
                  {comment}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 text-sm text-gray-700 dark:text-gray-300 font-medium text-right whitespace-nowrap">
              {item.price.toLocaleString()} {item.currency}
              {displayCurrency !== 'RUB' && exchangeRates && exchangeRates[displayCurrency] && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  (≈ {(item.price * exchangeRates[displayCurrency]).toLocaleString(undefined, { maximumFractionDigits: 1 })} {displayCurrency})
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end items-center gap-2 mt-1">
            <div className="flex-shrink-0">
              <div 
                className={`h-5 w-5 border rounded flex items-center justify-center cursor-pointer focus:outline-none touch-manipulation transition-colors ${item.isBought ? 'bg-gray-900 dark:bg-gray-600 border-gray-900 dark:border-gray-600' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'}`}
                onClick={() => onToggleBought(item.id)}
                style={{ touchAction: 'manipulation' }}
                tabIndex={0}
                role="checkbox"
                aria-checked={item.isBought}
                aria-label="Отметить как купленное"
              >
                {item.isBought && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>
            
            {/* Кнопки перемещения - отдельные кнопки для лучшей отзывчивости */}
            {index > 0 && (
              <button 
                onClick={() => onMoveItem(item.id, 'up')} 
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 active:text-gray-800 dark:active:text-gray-100 p-2 touch-manipulation select-none"
                style={{ touchAction: 'manipulation' }}
                aria-label="Переместить вверх"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {index < totalItems - 1 && (
              <button 
                onClick={() => onMoveItem(item.id, 'down')} 
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 active:text-gray-800 dark:active:text-gray-100 p-2 touch-manipulation select-none"
                style={{ touchAction: 'manipulation' }}
                aria-label="Переместить вниз"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            
            <button onClick={() => onEditClick(item.id)} className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 active:text-blue-800 dark:active:text-blue-300 p-2 touch-manipulation" style={{ touchAction: 'manipulation' }} title="Редактировать">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button onClick={() => onDeleteItem(item.id)} className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 active:text-red-800 dark:active:text-red-300 p-2 touch-manipulation" style={{ touchAction: 'manipulation' }} title="Удалить">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0 px-4 sm:px-6 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center py-3 sm:py-4">
        <div className="mr-4 flex-shrink-0">
          <div 
            className={`h-5 w-5 border rounded flex items-center justify-center cursor-pointer focus:outline-none touch-manipulation transition-colors ${item.isBought ? 'bg-gray-900 dark:bg-gray-600 border-gray-900 dark:border-gray-600' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'}`}
            onClick={() => onToggleBought(item.id)}
            style={{ touchAction: 'manipulation' }}
            tabIndex={0}
            role="checkbox"
            aria-checked={item.isBought}
            aria-label="Отметить как купленное"
          >
            {item.isBought && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3 sm:w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        
        <div className="mr-4 flex-shrink-0">
          <button
            ref={desktopButtonRef}
            onClick={() => onToggleSelected(item.id, desktopButtonRef.current || undefined)}
            className={`h-5 w-5 rounded-full p-0.5 border flex items-center justify-center focus:outline-none transition-colors touch-manipulation ${
              isSelected ? 'bg-gray-900 dark:bg-gray-600 border-gray-900 dark:border-gray-600 text-white' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500'
            }`}
            style={{ touchAction: 'manipulation' }}
            title={isSelected ? "Убрать из расчета" : "Добавить в расчет"}
            aria-label={isSelected ? "Убрать из расчета" : "Добавить в расчет"}
          >
            {isSelected ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
        
        <button 
          {...listeners}
          className="mr-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 rounded"
          title="Перетащить"
          aria-label="Перетащить элемент"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex-grow min-w-0 mr-4">
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {item.link ? (
              <a 
                href={formatUrl(item.link)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 underline hover:text-blue-600 dark:hover:text-blue-400 break-words transition-colors duration-150"
              >
                {item.name}
              </a>
            ) : (
              <span className="break-words">{item.name}</span>
            )}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 sm:text-gray-600 dark:sm:text-gray-400 mt-1 sm:mt-0 truncate">
            {item.itemType}
          </div>
          {comment && (
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 break-words">
              {comment}
            </div>
          )}
        </div>
        
        <div className="text-right text-gray-700 dark:text-gray-300 font-medium ml-auto mr-4 flex-shrink-0">
          <span>{item.price.toLocaleString()} {item.currency}</span>
          {displayCurrency !== 'RUB' && (
            <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
              {exchangeRates && exchangeRates[displayCurrency] ? (
                `(≈ ${(item.price * exchangeRates[displayCurrency]).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${displayCurrency})`
              ) : (
                <span className="text-red-400 dark:text-red-300">(N/A)</span>
              )}
            </span>
          )}
        </div>
        
        <div className="flex space-x-1 flex-shrink-0 ml-1">
          <button 
            onClick={() => onEditClick(item.id)}
            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 active:text-blue-800 dark:active:text-blue-300 active:bg-blue-50 dark:active:bg-blue-900/30 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-w-[36px] min-h-[36px] flex items-center justify-center transition duration-150 ease-in-out touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            title="Редактировать"
            tabIndex={0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onDeleteItem(item.id)}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 active:text-red-800 dark:active:text-red-300 active:bg-red-50 dark:active:bg-red-900/30 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 min-w-[36px] min-h-[36px] flex items-center justify-center transition duration-150 ease-in-out touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            title="Удалить"
            tabIndex={0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};