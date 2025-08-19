import React, { useEffect, useMemo, useRef } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { useIsMobile } from '../hooks/useIsMobile';

interface CategorySidebarProps {
  items: WishlistItem[];
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onAddCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => Promise<{ success: boolean; message: string } | void> | void;
  isOpen: boolean;
  onClose: () => void;
}

// Цветовые индикаторы для категорий
const getCategoryColor = (index: number): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-red-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500'
  ];
  return colors[index % colors.length];
};

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  items,
  categories,
  activeCategory,
  onCategoryChange,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  isOpen,
  onClose
}) => {
  const isMobile = useIsMobile();
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [editingCategory, setEditingCategory] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState('');
  const listScrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHasFocus, setPanelHasFocus] = React.useState(false);
  const [canScroll, setCanScroll] = React.useState(false);

  // Закрытие панели по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Блокировка прокрутки body при открытой панели на мобильных
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isMobile, isOpen]);

  // Управление фокусом, чтобы не выставлять aria-hidden, когда внутри есть фокус
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const handleFocusIn = () => setPanelHasFocus(true);
    const handleFocusOut = () => {
      // Отложенно проверяем, действительно ли фокус ушёл
      setTimeout(() => {
        if (el && !el.contains(document.activeElement)) setPanelHasFocus(false);
      }, 0);
    };
    el.addEventListener('focusin', handleFocusIn);
    el.addEventListener('focusout', handleFocusOut as any);
    return () => {
      el.removeEventListener('focusin', handleFocusIn);
      el.removeEventListener('focusout', handleFocusOut as any);
    };
  }, []);

  // При закрытии панели убираем фокус из её области
  useEffect(() => {
    if (!isOpen) {
      const el = panelRef.current;
      if (el && el.contains(document.activeElement)) {
        (document.activeElement as HTMLElement | null)?.blur?.();
        setPanelHasFocus(false);
      }
    }
  }, [isOpen]);

  // Помечаем состояние панели на body для сдвига кнопки наверх
  useEffect(() => {
    if (isOpen) document.body.dataset.sidebarOpen = 'true';
    else delete document.body.dataset.sidebarOpen;
    return () => { delete document.body.dataset.sidebarOpen; };
  }, [isOpen]);

  // Включаем вертикальный скролл только если есть переполнение
  useEffect(() => {
    const el = listScrollRef.current;
    if (!el) return;
    const checkOverflow = () => {
      setCanScroll(el.scrollHeight > el.clientHeight + 4);
    };
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    window.addEventListener('resize', checkOverflow);
    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener('resize', checkOverflow);
    };
  }, [categories, items, isOpen]);

  // Подсчет товаров по категориям и статусам
  const stats = useMemo(() => {
    const totalItems = items.length;
    const boughtItems = items.filter(item => item.isBought).length;
    const pendingItems = totalItems - boughtItems;
    
    const categoryStats = new Map<string, { total: number; bought: number; pending: number }>();
    let uncategorizedTotal = 0;
    let uncategorizedBought = 0;
    
    items.forEach(item => {
      const category = item.category?.trim();
      if (!category) {
        uncategorizedTotal++;
        if (item.isBought) uncategorizedBought++;
      } else {
        if (!categoryStats.has(category)) {
          categoryStats.set(category, { total: 0, bought: 0, pending: 0 });
        }
        const stats = categoryStats.get(category)!;
        stats.total++;
        if (item.isBought) {
          stats.bought++;
        } else {
          stats.pending++;
        }
      }
    });

    return {
      total: totalItems,
      bought: boughtItems,
      pending: pendingItems,
      uncategorized: {
        total: uncategorizedTotal,
        bought: uncategorizedBought,
        pending: uncategorizedTotal - uncategorizedBought
      },
      categories: categoryStats
    };
  }, [items]);

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleCancelAddCategory = () => {
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    } else if (e.key === 'Escape') {
      handleCancelAddCategory();
    }
  };

  // Убрана автопрокрутка при открытии формы добавления (кнопка теперь сверху)

  // Не размонтируем панель ради анимации закрытия

  return (
    <>
      {/* Прозрачный оверлей для закрытия по клику вне панели (без затемнения) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={onClose}
        />
      )}

      {/* Боковая панель */}
      <div 
        ref={panelRef}
        aria-hidden={!isOpen && !panelHasFocus ? true : undefined}
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-[#222222] shadow-xl z-[100] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-x-hidden`}
      >
        {/* Заголовок - липкий на мобильных */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#222222] ${
          isMobile ? 'sticky top-0 z-10' : ''
        }`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            КАТЕГОРИИ
          </h2>
          <button
            onClick={onClose}
            onTouchStart={onClose}
            type="button"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors pointer-events-auto"
            aria-label="Закрыть боковую панель"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        

        {/* Содержимое панели */}
        <div className="flex flex-col h-full">
          {/* Раздел быстрых фильтров удалён по требованию */}

          {/* Категории */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-shrink-0 p-4 pb-2">
              {/* Добавление новой категории — перенесено вверх и выполнено в монохромном стиле */}
              <div className="mt-2">
                {isAddingCategory ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Название категории"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-300 bg-white dark:bg-[#222222] text-gray-900 dark:text-gray-100"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCategory}
                        className="flex-1 px-2 py-1.5 bg-black dark:bg-[#4B5563] text-white text-xs font-medium rounded-md hover:bg-gray-900 dark:hover:bg-[#374151] transition-colors"
                      >
                        Создать
                      </button>
                      <button
                        onClick={handleCancelAddCategory}
                        className="px-2 py-1.5 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="w-full flex items-center justify-center gap-2 p-2 text-black dark:text-white border-2 border-dashed border-gray-800 dark:border-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">Добавить категорию</span>
                  </button>
                )}
              </div>
            </div>
            
            <div ref={listScrollRef} className={`flex-1 ${canScroll ? 'overflow-y-auto' : 'overflow-y-hidden'} overflow-x-hidden px-4`}>
              {/* Без категории */}
              <div className={`w-full rounded-lg group mb-2 ${
                  activeCategory === 'all'
                    ? 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    : ''
                }`}>
                <div className="grid grid-cols-[1fr_3rem_3rem] gap-2 items-center">
                  <button
                    onClick={() => {
                      onCategoryChange('all');
                      onClose();
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors min-w-0 text-left ${
                      activeCategory === 'all'
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-400" />
                    <span className="font-medium whitespace-normal break-words text-[15px] leading-tight">
                      Без категории
                    </span>
                  </button>
                  <div className="flex justify-center">
                    <span className="w-7 text-center text-xs font-semibold bg-black dark:bg-[#4B5563] px-1.5 py-0.5 rounded-full text-white">
                      {stats.uncategorized.total}
                    </span>
                  </div>
                  {/* Пустая зона под иконки для выравнивания */}
                  <div />
                </div>
              </div>

              {/* Список категорий */}
              {categories.map((category, index) => {
                const categoryStats = stats.categories.get(category);
                const isActive = activeCategory === category;
                
                return (
                  <div key={category} className="relative group mb-2 last:mb-0">
                    <div className="grid grid-cols-[1fr_3rem_3rem] gap-2 items-center">
                      <button
                        onClick={() => {
                          if (editingCategory !== category) {
                            onCategoryChange(category);
                            onClose();
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors min-w-0 text-left ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getCategoryColor(index)}`} />
                        {editingCategory === category ? (
                          <input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && onRenameCategory) {
                                const v = editingValue.trim();
                                if (v && v !== category) onRenameCategory(category, v);
                                setEditingCategory(null);
                              } else if (e.key === 'Escape') {
                                setEditingCategory(null);
                                setEditingValue('');
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-w-0"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium whitespace-normal break-words leading-tight text-[15px]">
                            {category}
                          </span>
                        )}
                      </button>
                      <div className="flex justify-center">
                        <span className="w-7 text-center text-xs font-semibold bg-black dark:bg-[#4B5563] px-1.5 py-0.5 rounded-full text-white">
                          {categoryStats?.total || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 transition-opacity opacity-100">
                        {editingCategory === category ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!onRenameCategory) return;
                                const v = editingValue.trim();
                                if (v && v !== category) onRenameCategory(category, v);
                                setEditingCategory(null);
                              }}
                              className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                              aria-label={`Сохранить категорию ${category}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(null);
                                setEditingValue('');
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              aria-label={`Отменить редактирование ${category}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Кнопка переименования */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setEditingValue(category);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              aria-label={`Переименовать категорию ${category}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            {/* Кнопка удаления */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCategory(category);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                              aria-label={`Удалить категорию ${category}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
