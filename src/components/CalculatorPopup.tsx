import React from 'react';
import { WishlistItem } from '../types/wishlistItem';

interface CalculatorPopupProps {
  selectedCount: number;
  selectedItems: WishlistItem[];
  selectedTotal: number;
  displayCurrency: string;
  position: { top: number, left: number, width: number };
  onClear: () => void;
}

export const CalculatorPopup: React.FC<CalculatorPopupProps> = ({
  selectedCount,
  selectedItems,
  selectedTotal,
  displayCurrency,
  position,
  onClear
}) => {
  return (
    <div 
      className="fixed bg-indigo-50 dark:bg-gray-800 p-4 rounded-lg border border-indigo-200 dark:border-gray-600 text-sm shadow-xl z-[9999] max-w-[calc(100vw-40px)]"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'auto'
      }}
    >
      <button 
        onClick={onClear}
        className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500 transition-colors"
        aria-label="Очистить выбранные"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2 pr-8">Выбрано для расчета: {selectedCount}</h3>
      <ul className="max-h-40 overflow-y-auto mb-2 pr-2 space-y-1"> 
        {selectedItems.map(item => (
          <li key={item.id} className="text-indigo-700 dark:text-indigo-300 text-xs truncate" title={item.name}>{item.name}</li>
        ))}
      </ul>
      <div className="text-sm text-indigo-800 dark:text-indigo-300 mt-1 font-medium">
        Сумма: <span className="font-semibold text-indigo-900 dark:text-indigo-200">{selectedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} {displayCurrency}</span>
      </div>
    </div>
  );
}; 