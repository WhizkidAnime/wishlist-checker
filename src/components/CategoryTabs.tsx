import React, { useState, useRef, useEffect } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { DesktopOnlyTooltip } from './ui/DesktopOnlyTooltip';
import { useIsMobile } from '../hooks/useIsMobile';

interface CategoryTabsProps {
  items: WishlistItem[];
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onAddCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
}

export const CategoryTabs = ({ 
  items, 
  categories,
  activeCategory, 
  onCategoryChange,
  onAddCategory,
  onDeleteCategory
}: CategoryTabsProps) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [lastTappedCategory, setLastTappedCategory] = useState<string | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Обработчик прокрутки колесом мыши для горизонтальной прокрутки
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      // Проверяем, можем ли мы предотвратить событие
      // Не используем preventDefault для пассивных слушателей
      try {
        // Только пытаемся предотвратить если не пассивный слушатель
        if (e.cancelable !== false) {
          e.preventDefault();
        }
        e.stopPropagation();
      } catch (error) {
        // Игнорируем ошибки preventDefault в пассивных слушателях
        console.log('Не удалось предотвратить событие (пассивный слушатель)');
      }
      
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Функции для прокрутки влево и вправо
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Автоматическая прокрутка до конца при открытии формы добавления
  useEffect(() => {
    if (isAddingCategory && scrollContainerRef.current) {
      // Небольшая задержка для завершения рендера
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            left: scrollContainerRef.current.scrollWidth,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  }, [isAddingCategory]);

  // Подсчитываем количество товаров в каждой категории
  const getCategoryCount = (category: string) => {
    if (category === 'all') {
      // В разделе "Без категории" считаем только товары БЕЗ категории
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

  const handleCancelCategory = () => {
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    } else if (e.key === 'Escape') {
      handleCancelCategory();
    }
  };

  // Обработчик клика по категории (с учетом мобильного двойного тапа)
  const handleCategoryClick = (category: string) => {
    if (isMobile) {
      const now = Date.now();
      const timeDiff = now - lastTapTime;
      
      if (lastTappedCategory === category && timeDiff < 500) {
        // Двойной тап на мобиле - показываем удаление только если категория активна
        if (activeCategory === category) {
          onDeleteCategory(category);
        }
      } else {
        // Первый тап - переключаем категорию
        onCategoryChange(category);
        setLastTappedCategory(category);
        setLastTapTime(now);
      }
    } else {
      // На десктопе просто переключаем категорию
      onCategoryChange(category);
    }
  };

  // Обработчик удаления категории на десктопе
  const handleDeleteClick = (e: React.MouseEvent, category: string) => {
    e.stopPropagation();
    onDeleteCategory(category);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-600 mb-4">
      <div className="relative">
        {/* Кнопка прокрутки влево */}
        {isMobile && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-md rounded-full p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            style={{ marginTop: '-1px' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div 
          ref={scrollContainerRef} 
          className={`flex items-center gap-1 overflow-x-auto scrollbar-hide ${isMobile ? 'px-8' : ''}`}
          onWheel={handleWheel}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {/* Вкладка "Без категории" */}
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 focus:outline-none ${
            activeCategory === 'all'
              ? 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
        >
          Без категории ({getCategoryCount('all')})
        </button>

        {/* Вкладки категорий */}
        {categories.map(category => (
          <div
            key={category}
            className="relative group flex items-center"
            onMouseEnter={() => !isMobile && setHoveredCategory(category)}
            onMouseLeave={() => !isMobile && setHoveredCategory(null)}
          >
            <button
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 focus:outline-none ${
                activeCategory === category
                  ? 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              {category} ({getCategoryCount(category)})
            </button>
            
            {/* Крестик для удаления на десктопе - вне кнопки категории */}
            {!isMobile && hoveredCategory === category && (
              <DesktopOnlyTooltip content={`Удалить категорию "${category}"`} position="top" usePortal={true}>
                <button
                  onClick={(e) => handleDeleteClick(e, category)}
                  className="ml-1 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 focus:outline-none rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </DesktopOnlyTooltip>
            )}
            

          </div>
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
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 min-w-[120px] placeholder:text-xs input-theme"
              autoFocus
            />
            <DesktopOnlyTooltip content="Сохранить новую категорию" position="top" usePortal={true}>
              <button
                onClick={handleAddCategory}
                className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-150 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </DesktopOnlyTooltip>
            <DesktopOnlyTooltip content="Отменить создание категории" position="top" usePortal={true}>
              <button
                onClick={handleCancelCategory}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </DesktopOnlyTooltip>
          </div>
        ) : (
          <DesktopOnlyTooltip content="Добавить новую категорию" position="top" usePortal={true}>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition-colors duration-150 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </DesktopOnlyTooltip>
        )}
        </div>

        {/* Кнопка прокрутки вправо */}
        {isMobile && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-md rounded-full p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            style={{ marginTop: '-1px' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}; 