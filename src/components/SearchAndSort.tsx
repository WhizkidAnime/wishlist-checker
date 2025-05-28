import React, { useRef, useEffect } from 'react';

interface SearchAndSortProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'default' | 'type-asc' | 'price-asc' | 'price-desc';
  setSortBy: (sort: 'default' | 'type-asc' | 'price-asc' | 'price-desc') => void;
  showSortDropdown: boolean;
  setShowSortDropdown: (show: boolean) => void;
  isMobile: boolean;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  itemsCount: number;
}

function getItemsCountText(count: number): string {
  const num = Math.abs(count) % 100; 
  const lastDigit = num % 10; 

  let result = 'элементов';

  if (num >= 11 && num <= 19) {
    result = 'элементов';
  } else if (lastDigit === 1) {
    result = 'элемент';
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    result = 'элемента';
  }
  
  return result;
}

export const SearchAndSort: React.FC<SearchAndSortProps> = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  showSortDropdown,
  setShowSortDropdown,
  isMobile,
  onExport,
  onImport,
  itemsCount
}) => {
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    if (showSortDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showSortDropdown, setShowSortDropdown]);

  return (
    <div className="flex flex-col justify-between gap-4 border-b pb-4 border-gray-200">
      {/* Верхняя строка: поиск и кнопки */}
      <div className="flex flex-row items-center gap-4">
        <div className="relative flex-grow w-48">
          <input 
            type="text"
            placeholder="Поиск по названию/типу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Очистить поиск"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={onExport}
            className="flex-none px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors duration-150"
          >
            Экспорт
          </button>
          <input 
            type="file" 
            accept=".json"
            onChange={onImport}
            style={{ display: 'none' }}
            id="import-file-input"
          />
          <button 
            onClick={() => document.getElementById('import-file-input')?.click()}
            className="flex-none px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors duration-150"
          >
            Импорт
          </button>
        </div>
      </div>

      {/* Нижняя строка: счетчик и сортировка */}
      <div className="flex flex-row items-center justify-between">
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {itemsCount} {getItemsCountText(itemsCount)}
        </span>
        
        {isMobile ? (
          // Мобильная версия - выпадающий список
          <div className="relative" ref={sortDropdownRef}>
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 shadow-sm"
              aria-label="Открыть параметры сортировки"
            >
              <span className="font-medium">
                {sortBy === 'default' && 'Стандарт'}
                {sortBy === 'type-asc' && 'Тип А-Я'}
                {sortBy === 'price-asc' && 'Цена ↑'}
                {sortBy === 'price-desc' && 'Цена ↓'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-36">
                <button 
                  onClick={() => {
                    setSortBy('default');
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'default' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                >
                  Стандарт
                </button>
                <button 
                  onClick={() => {
                    setSortBy('type-asc');
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'type-asc' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                >
                  Тип А-Я
                </button>
                <button 
                  onClick={() => {
                    setSortBy('price-asc');
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'price-asc' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                >
                  Цена ↑
                </button>
                <button 
                  onClick={() => {
                    setSortBy('price-desc');
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${sortBy === 'price-desc' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                >
                  Цена ↓
                </button>
              </div>
            )}
          </div>
        ) : (
          // Десктопная версия - кнопки в ряд
          <div className="flex items-center gap-1.5 text-xs text-sm flex-wrap">
            <span className="text-gray-500 mr-1">Сортировать:</span>
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => setSortBy('default')}
                className={`px-2 py-0.5 rounded transition-colors min-w-[70px] text-center ${sortBy === 'default' ? 'bg-gray-200 text-gray-800 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
              >
                Стандарт
              </button>
              <button 
                onClick={() => setSortBy('type-asc')}
                className={`px-2 py-0.5 rounded transition-colors min-w-[70px] text-center ${sortBy === 'type-asc' ? 'bg-gray-200 text-gray-800 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
              >
                Тип А-Я
              </button>
              <button 
                onClick={() => setSortBy('price-asc')}
                className={`px-2 py-0.5 rounded transition-colors min-w-[70px] text-center ${sortBy === 'price-asc' ? 'bg-gray-200 text-gray-800 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
              >
                Цена ↑
              </button>
              <button 
                onClick={() => setSortBy('price-desc')}
                className={`px-2 py-0.5 rounded transition-colors min-w-[70px] text-center ${sortBy === 'price-desc' ? 'bg-gray-200 text-gray-800 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
              >
                Цена ↓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 