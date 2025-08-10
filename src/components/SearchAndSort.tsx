import React, { useRef, useEffect, useState } from 'react';
import { DesktopOnlyTooltip } from './ui/DesktopOnlyTooltip';
import { cn } from '../utils/cn';

interface SearchAndSortProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'default' | 'type-asc' | 'price-asc' | 'price-desc';
  setSortBy: (sort: 'default' | 'type-asc' | 'price-asc' | 'price-desc') => void;
  showSortDropdown: boolean;
  setShowSortDropdown: (show: boolean) => void;
  itemsCount: number;
  isMobile: boolean;
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

const SearchAndSortComponent: React.FC<SearchAndSortProps> = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  showSortDropdown,
  setShowSortDropdown,
  itemsCount,
  isMobile
}) => {
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);

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

  // Дребезг: наружу отправляем с задержкой
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (localQuery !== searchQuery) setSearchQuery(localQuery);
    }, 200);
    return () => window.clearTimeout(t);
  }, [localQuery]);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSortChange = (newSort: 'default' | 'type-asc' | 'price-asc' | 'price-desc') => {
    setSortBy(newSort);
    setShowSortDropdown(false);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'default':
        return 'Стандарт';
      case 'type-asc':
        return 'Тип А-Я';
      case 'price-asc':
        return 'Цена ↑';
      case 'price-desc':
        return 'Цена ↓';
      default:
        return 'Стандарт';
    }
  };

  return (
    <div className="flex flex-col justify-between gap-4 border-b pb-4 border-gray-200 dark:border-gray-600">
      {/* Верхняя строка: поиск и кнопки */}
      <div className="flex items-center gap-4">
        {/* Поле поиска с кнопкой очистки */}
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder="Поиск..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-theme-card text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 placeholder:text-xs transition-colors duration-200"
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="Очистить поиск"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Кнопки экспорта/импорта - ЗАКОММЕНТИРОВАНЫ */}
        {/*
        <div className="flex gap-2">
          <DesktopOnlyTooltip content="Экспорт">
            <button 
              onClick={onExport}
              className="flex-none px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors duration-150"
            >
              Экспорт
            </button>
          </DesktopOnlyTooltip>
          <input 
            type="file" 
            accept=".json"
            onChange={onImport}
            style={{ display: 'none' }}
            id="import-file-input"
          />
          <DesktopOnlyTooltip content="Импорт">
            <button 
              onClick={() => document.getElementById('import-file-input')?.click()}
              className="flex-none px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors duration-150"
            >
              Импорт
            </button>
          </DesktopOnlyTooltip>
        </div>
        */}
      </div>

      {/* Нижняя строка: счетчик и сортировка */}
      <div className="flex flex-row items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {itemsCount} {getItemsCountText(itemsCount)}
        </span>
        
        {isMobile ? (
          // Мобильная версия - выпадающий список
          <div className="relative" ref={sortDropdownRef}>
            <DesktopOnlyTooltip content="Открыть параметры сортировки">
              <button 
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-150 flex items-center whitespace-nowrap"
              >
                <span>{getSortLabel()}</span>
                <svg 
                  className={cn(
                    "w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200",
                    showSortDropdown && "rotate-180"
                  )}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </DesktopOnlyTooltip>
            
            {showSortDropdown && (
              <div 
                className={`absolute top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 ${
                  isMobile ? 'right-0' : 'left-0'
                }`}
                style={{ backgroundColor: 'var(--color-card-background)' }}
              >
                <div className="py-1">
                  <button
                    onClick={() => handleSortChange('default')}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 ${
                      sortBy === 'default' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors duration-200`}
                  >
                    Стандарт
                  </button>
                  <button
                    onClick={() => handleSortChange('type-asc')}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 ${
                      sortBy === 'type-asc' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors duration-200`}
                  >
                    Тип А-Я
                  </button>
                  <button
                    onClick={() => handleSortChange('price-asc')}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 ${
                      sortBy === 'price-asc' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors duration-200`}
                  >
                    Цена ↑
                  </button>
                  <button
                    onClick={() => handleSortChange('price-desc')}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 ${
                      sortBy === 'price-desc' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors duration-200`}
                  >
                    Цена ↓
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Десктопная версия - кнопки в ряд
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-gray-500 dark:text-gray-400 mr-1">Сортировать:</span>
            <div className="flex flex-wrap gap-1.5">
              <DesktopOnlyTooltip content="Стандарт">
                <button 
                  onClick={() => setSortBy('default')}
                  className={`px-2 py-0.5 rounded transition-colors min-w-[70px] text-center focus:outline-none ${sortBy === 'default' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-theme-secondary font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  Стандарт
                </button>
              </DesktopOnlyTooltip>
              <DesktopOnlyTooltip content="Тип А-Я">
                <button 
                  onClick={() => setSortBy('type-asc')}
                  className={`px-2 py-0.5 rounded transition-colors min-w-[70px] text-center focus:outline-none ${sortBy === 'type-asc' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-theme-secondary font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  Тип А-Я
                </button>
              </DesktopOnlyTooltip>
              <DesktopOnlyTooltip content="Цена ↑">
                <button 
                  onClick={() => setSortBy('price-asc')}
                  className={`px-2 py-0.5 rounded transition-colors min-w-[70px] text-center focus:outline-none ${sortBy === 'price-asc' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-theme-secondary font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  Цена ↑
                </button>
              </DesktopOnlyTooltip>
              <DesktopOnlyTooltip content="Цена ↓">
                <button 
                  onClick={() => setSortBy('price-desc')}
                  className={`px-2 py-0.5 rounded transition-colors min-w-[70px] text-center focus:outline-none ${sortBy === 'price-desc' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-theme-secondary font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  Цена ↓
                </button>
              </DesktopOnlyTooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
export const SearchAndSort = React.memo(SearchAndSortComponent);