import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { AddItemForm } from './AddItemForm';
import WishlistItem from './WishlistItem';
import { SearchAndSort } from './SearchAndSort';
import { CalculatorPopup } from './CalculatorPopup';
import { CategoryTabs } from './CategoryTabs';
import { AdaptiveControlPanel } from './AdaptiveControlPanel';
import { BulkActionBar } from './BulkActionBar';
import { BulkDeleteModal } from './BulkDeleteModal';
import { CategoryDeleteModal } from './CategoryDeleteModal';
import { HelpModal } from './ui/HelpModal';
import { ShareWishlistModal } from './ShareWishlistModal';
import { ProgressBar } from './ProgressBar';

import { useWishlist } from '../hooks/useWishlist';
import { useSelection } from '../hooks/useSelection';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { useCalculatorPosition } from '../hooks/useCalculatorPosition';
import { useResponsive } from '../hooks/useResponsive';
import { useDeleteModal } from '../hooks/useDeleteModal';
import { useDndSensors } from '../hooks/useDndSensors';
import { useCategories } from '../hooks/useCategories';
import { useTheme } from '../hooks/useTheme';
import { useBulkActions } from '../hooks/useBulkActions';
import { useAuth } from '../hooks/useAuth';
import React from 'react';

// Внутренние подкомпоненты для уменьшения когнитивной сложности разметки
interface HeaderProps {
  adaptiveControlPanel: React.ReactNode;
  mobileLeftControl: React.ReactNode;
  mobileRightControl: React.ReactNode;
  isSidebarOpen?: boolean;
}

function Header({ mobileLeftControl, mobileRightControl, isSidebarOpen }: HeaderProps) {
  return (
    <div
      className={`relative w-full max-w-4xl mb-6 sm:mb-8 z-30 ${isSidebarOpen ? 'pointer-events-none' : ''}`}
      aria-hidden={isSidebarOpen ? true : undefined}
    >
      {/* Мобильная версия - простая панель управления сверху */}
      <div className="sm:hidden">
        <div className={`relative flex items-center mb-4 transition-opacity duration-200 ${
          isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          {/* Слева — только переключатель темы */}
          <div className="flex-shrink-0 -ml-1">{mobileLeftControl}</div>

          {/* Заголовок по центру в две строки */}
          <div className="absolute inset-x-0 text-center pointer-events-none">
            <h1 className="text-2xl font-bold text-theme-text leading-tight">
              <div>Wishlist</div>
              <div>checker</div>
            </h1>
          </div>

          {/* Справа — только профиль/бургер */}
          <div className="flex-shrink-0 ml-auto">{mobileRightControl}</div>
        </div>
      </div>

      {/* Десктопная версия - заголовок */}
      <div className="hidden sm:block text-center">
        <h1 className="text-4xl font-bold text-theme-text">Wishlist checker</h1>
      </div>
    </div>
  );
}

interface ListCardProps {
  themeCardClass: string;
  categories: string[];
  activeCategory: string;
  activeFilter: 'all' | 'bought' | 'pending';
  setActiveCategory: (c: string) => void;
  setActiveFilter: (f: 'all' | 'bought' | 'pending') => void;
  onAddCategory: (name: string) => Promise<void> | void;
  onDeleteCategory: (name: string) => void;
  onRenameCategory: (oldName: string, newName: string) => Promise<{ success: boolean; message: string } | void> | void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onAddItem: Parameters<typeof AddItemForm>[0]['onAddItem'];
  wishlist: ReturnType<typeof useWishlist>['wishlist'];
  displayedWishlist: ReturnType<typeof useWishlist>['wishlist'];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: 'default' | 'type-asc' | 'price-asc' | 'price-desc';
  setSortBy: (v: 'default' | 'type-asc' | 'price-asc' | 'price-desc') => void;
  showSortDropdown: boolean;
  setShowSortDropdown: (v: boolean) => void;
  isMobile: boolean;
  onShareOpen: () => void;
  editingItemId: ReturnType<typeof useWishlist>['editingItemId'];
  onToggleBought: (id: string | number) => void;
  onDeleteItemClick: (id: string | number) => void;
  onUpdateItem: ReturnType<typeof useWishlist>['handleUpdateItem'];
  onEditClick: ReturnType<typeof useWishlist>['handleEditClick'];
  onCancelEdit: ReturnType<typeof useWishlist>['handleCancelEdit'];
  displayCurrency: string;
  exchangeRates: Record<string, number>;
  selectedItemIds: (string | number)[];
  onToggleSelected: (id: string | number) => void;
  bulkSelectedItemIds: (string | number)[];
  onToggleBulkSelected: (id: string | number) => void;
  onMoveItem: (id: string | number, direction: 'up' | 'down') => Promise<void> | void;
  displayedTotalUnbought: number;
  displayedTotalBought: number;
}

function ListCard(props: ListCardProps) {
  const {
    themeCardClass,
    categories,
    activeCategory,
    // activeFilter, // не используется внутри ListCard
    setActiveCategory,
    // setActiveFilter, // не используется внутри ListCard
    onAddCategory,
    onDeleteCategory,
    onRenameCategory,
    isSidebarOpen,
    setIsSidebarOpen,
    onAddItem,
    wishlist,
    displayedWishlist,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    showSortDropdown,
    setShowSortDropdown,
    isMobile,
    onShareOpen,
    editingItemId,
    onToggleBought,
    onDeleteItemClick,
    onUpdateItem,
    onEditClick,
    onCancelEdit,
    displayCurrency,
    exchangeRates,
    selectedItemIds,
    onToggleSelected,
    bulkSelectedItemIds,
    onToggleBulkSelected,
    onMoveItem,
    displayedTotalUnbought,
    displayedTotalBought,
  } = props;

  const parentRef = useRef<HTMLDivElement>(null);
  const listHeaderRef = useRef<HTMLHeadingElement>(null);
  const enableVirtual = !isMobile && displayedWishlist.length > 40;
  const rowVirtualizer = enableVirtual
    ? useVirtualizer({
        count: displayedWishlist.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64,
        overscan: 8,
      })
    : null;

  const scrollToListHeader = () => {
    const el = listHeaderRef.current;
    if (!el) return;
    const offset = 16; // небольшой отступ сверху
    try {
      // Ждём перерисовку после изменения категории, затем скроллим точно к верху
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        });
      });
    } catch {}
  };

  const handleCategoryChangeAndScroll = (category: string) => {
    setActiveCategory(category);
    scrollToListHeader();
  };

  return (
    <div className={`w-full max-w-4xl ${themeCardClass} rounded-3xl shadow-lg p-4 sm:p-8 relative z-10 transition-colors duration-200`}>
      <AddItemForm onAddItem={onAddItem} existingCategories={categories} disabled={false} />

      <div className="flex items-center justify-between flex-wrap mt-6 mb-4 gap-3 border-b pb-4 border-gray-200 dark:border-gray-600">
        <h2 ref={listHeaderRef} className="text-xl font-semibold text-black dark:text-theme-secondary">Список желаний</h2>
        <div className="flex gap-2 ml-auto shrink-0">
          <button
            onClick={onShareOpen}
            className="px-3 py-1.5 rounded-full text-sm font-semibold bg-theme-button text-theme-button hover:bg-theme-button focus:outline-none transition-colors duration-150 ease-in-out"
          >
            Поделиться
          </button>
        </div>
      </div>

      <CategoryTabs
        items={wishlist}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChangeAndScroll}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
        onRenameCategory={onRenameCategory}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <SearchAndSort
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showSortDropdown={showSortDropdown}
        setShowSortDropdown={setShowSortDropdown}
        isMobile={isMobile}
        itemsCount={displayedWishlist.length}
      />

      {displayedWishlist.length > 0 ? (
        enableVirtual ? (
          <div className="border-t border-gray-200 dark:border-gray-600">
            <div ref={parentRef} className="relative overflow-auto" style={{ maxHeight: '60vh' }}>
              <div style={{ height: `${rowVirtualizer!.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {rowVirtualizer!.getVirtualItems().map((virtualRow) => {
                  const index = virtualRow.index;
                  const item = displayedWishlist[index];
                  return (
                    <div
                      key={item.id}
                      data-index={index}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <WishlistItem
                        item={item}
                        onToggleBought={onToggleBought}
                        onDeleteItem={() => onDeleteItemClick(item.id)}
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
                        totalItems={displayedWishlist.length}
                        comment={item.comment}
                        existingCategories={categories}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0 border-t border-gray-200 dark:border-gray-600" data-wishlist-container>
            {displayedWishlist.map((item, index) => (
              <WishlistItem
                key={item.id}
                item={item}
                onToggleBought={onToggleBought}
                onDeleteItem={() => onDeleteItemClick(item.id)}
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
                totalItems={displayedWishlist.length}
                comment={item.comment}
                existingCategories={categories}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8 border-t border-gray-200 dark:border-gray-600">
          {searchQuery ? 'Ничего не найдено' : 'Список желаний пуст. Добавьте что-нибудь!'}
        </div>
      )}

      <ProgressBar
        totalUnbought={displayedTotalUnbought}
        totalBought={displayedTotalBought}
        currency={displayCurrency}
        isMobile={isMobile}
      />
    </div>
  );
}

interface ScrollToTopButtonProps {
  isMobile: boolean;
  show: boolean;
  onClick: () => void;
}

function ScrollToTopButton({ isMobile, show, onClick }: ScrollToTopButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Вернуться к началу"
      className={`fixed z-40 p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none transition-all duration-300 ease-in-out ${
        isMobile ? 'bottom-6 right-5' : 'bottom-8 left-5'
      } ${show ? 'opacity-50 hover:opacity-100' : 'opacity-0 pointer-events-none'} ${
        // Сместим кнопку вправо, когда открыта боковая панель (используем data-атрибут на body)
        document?.body?.dataset?.sidebarOpen === 'true' ? 'translate-x-80' : ''
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}

interface CalculatorOverlayProps {
  visible: boolean;
  position: { top: number; left: number; width: number } | null;
  selectedCount: number;
  selectedItems: ReturnType<typeof useSelection>['selectedItems'];
  selectedTotal: number;
  displayCurrency: string;
  onClear: () => void;
}

function CalculatorOverlay({ visible, position, selectedCount, selectedItems, selectedTotal, displayCurrency, onClear }: CalculatorOverlayProps) {
  if (!visible || !position) return null;
  return (
    <CalculatorPopup
      selectedCount={selectedCount}
      selectedItems={selectedItems}
      selectedTotal={selectedTotal}
      displayCurrency={displayCurrency}
      position={position}
      onClear={onClear}
    />
  );
}

interface ConfirmDeleteModalProps {
  open: boolean;
  itemName?: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDeleteModal({ open, itemName, isDeleting, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="rounded-xl shadow-xl w-full max-w-md p-6 mx-auto" style={{ backgroundColor: 'var(--color-card-background)' }}>
        <h3 className="text-lg font-semibold text-black dark:text-theme-secondary mb-2">Подтвердите удаление</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Вы уверены, что хотите удалить "{itemName}"? Это действие необратимо.
        </p>
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
              'Удалить'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MainAppProps {
  triggerSync: (force?: boolean) => Promise<{ success: boolean; message: string; }>;
  onAuthModalOpen: () => void;
  onDataLoaded?: (isLoaded: boolean) => void;
}

export const MainApp: React.FC<MainAppProps> = ({ 
  triggerSync, 
  onAuthModalOpen,
  onDataLoaded 
}) => {
  const [displayCurrency] = useState<string>('RUB');
  const [exchangeRates] = useState<Record<string, number> | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string>('');
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'bought' | 'pending'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Получаем userId из контекста аутентификации  
  const { user } = useAuth();
  const userId = user?.id || null;
  const isAuthenticated = !!user; // Реальный статус аутентификации

  // Хук для управления темой
  const { 
    themeMode, 
    systemTheme, 
    getThemeConfig,
    supportsAutoTheme,
    setTheme
  } = useTheme(userId);
  const themeConfig = getThemeConfig();

  // Хуки для управления состоянием
  const {
    wishlist,
    editingItemId,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    getFilteredAndSortedItems,
    handleAddItem,
    handleUpdateItem,
    handleToggleBought,
    handleMoveItem,
    handleDragEnd,
    handleDeleteItem,
    handleEditClick,
    handleCancelEdit,
    isLoading: isWishlistLoading,
    hasInitialLoadCompleted
  } = useWishlist(triggerSync, isAuthenticated);

  const {
    activeCategory,
    setActiveCategory,
    categories,
    filterByCategory,
    handleAddCategory,
    handleDeleteCategory,
    handleRenameCategory,
    resetCategoryIfNeeded,
    hasInitialCategoriesLoaded
  } = useCategories(wishlist, triggerSync, isAuthenticated, userId);

  // Применяем фильтры: сначала фильтруем по статусу покупок, затем по категории и поиску
  const displayedWishlist = useMemo(() => {
    // Фильтрация по статусу покупок
    let filteredByStatus = wishlist;
    if (activeFilter === 'bought') {
      filteredByStatus = wishlist.filter(item => item.isBought);
    } else if (activeFilter === 'pending') {
      filteredByStatus = wishlist.filter(item => !item.isBought);
    }

    if (searchQuery.trim()) {
      return getFilteredAndSortedItems(filteredByStatus);
    } else {
      const categoryFiltered = filterByCategory(filteredByStatus);
      return getFilteredAndSortedItems(categoryFiltered);
    }
  }, [wishlist, activeCategory, activeFilter, searchQuery, sortBy, filterByCategory, getFilteredAndSortedItems]);

  // Сбрасываем категорию если она больше не существует
  useEffect(() => {
    resetCategoryIfNeeded();
  }, [categories, resetCategoryIfNeeded]);

  // Уведомляем о состоянии загрузки данных
  useEffect(() => {
    if (!onDataLoaded) return;
    // Для авторизованных: ждём завершения начальной загрузки и отсутствие текущего isLoading
    const dataReady = isAuthenticated 
      ? (hasInitialLoadCompleted && hasInitialCategoriesLoaded && !isWishlistLoading)
      : true;
    onDataLoaded(dataReady);
  }, [isAuthenticated, hasInitialLoadCompleted, hasInitialCategoriesLoaded, isWishlistLoading, onDataLoaded]);

  const {
    selectedItemIds,
    selectedTotal,
    selectedCount,
    selectedItems,
    handleToggleSelected: baseHandleToggleSelected,
    clearSelection
  } = useSelection(wishlist);

  // Хук для массовых операций (отдельно от калькулятора)
  const {
    bulkSelectedItemIds,
    bulkSelectedItems,
    handleToggleBulkSelected,
    clearBulkSelection,
    removeFromBulkSelection
  } = useBulkSelection(wishlist);

  // Хук для массовых операций
  const {
    bulkDeleteItems,
    bulkMoveToCategory,
    isDeleting: isBulkDeleting,
    isMoving: isBulkMoving
  } = useBulkActions(userId, triggerSync, clearBulkSelection);

  const {
    calculatorPosition,
    showCalculator,
    hideCalculator
  } = useCalculatorPosition();

  const { isMobile, isDesktopWide, showScrollButton, scrollToTop } = useResponsive();

  const {
    isDeleteModalOpen,
    itemToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel
  } = useDeleteModal(handleDeleteItem, removeFromBulkSelection);

  const sensors = useDndSensors();

  // Обработчики массовых действий
  const handleBulkDelete = () => {
    setIsBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    const selectedIds = bulkSelectedItems.map(item => item.id);
    await bulkDeleteItems(selectedIds);
    setIsBulkDeleteModalOpen(false);
  };

  const handleBulkDeleteCancel = () => {
    setIsBulkDeleteModalOpen(false);
  };

  const handleBulkMoveToCategory = async (categoryName: string | null) => {
    const selectedIds = bulkSelectedItems.map(item => item.id);
    await bulkMoveToCategory(selectedIds, categoryName);
  };

  // Обработчики удаления категории
  const handleCategoryDeleteClick = (categoryName: string) => {
    setCategoryToDelete(categoryName);
    setIsCategoryDeleteModalOpen(true);
  };

  const handleCategoryDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    setIsDeletingCategory(true);
    try {
      const result = await handleDeleteCategory(categoryToDelete);
      if (result.success) {
        setIsCategoryDeleteModalOpen(false);
        setCategoryToDelete('');
      } else {
        console.error('Ошибка удаления категории:', result.message);
        // Здесь можно добавить уведомление пользователю об ошибке
      }
    } catch (error) {
      console.error('Критическая ошибка при удалении категории:', error);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleCategoryDeleteCancel = () => {
    setIsCategoryDeleteModalOpen(false);
    setCategoryToDelete('');
  };

  // Расширенная функция toggleSelected с поддержкой позиционирования калькулятора
  const handleToggleSelected = (id: string | number) => {
    const wasSelected = selectedItemIds.includes(id);
    baseHandleToggleSelected(id);
    
    if (!wasSelected && selectedItemIds.length === 0) {
      showCalculator();
    }
    
    if (wasSelected && selectedItemIds.length === 1) {
      hideCalculator();
    }
  };

  const clearCalculator = () => {
    clearSelection();
    hideCalculator();
  };

  const handleDeleteItemClick = (id: string | number) => {
    const item = wishlist.find(item => item.id === id);
    if (item) {
      handleDeleteClick(item);
    }
  };

  // Рассчитываем итоговые суммы для текущей отображаемой категории/поиска
  const displayedTotalUnbought = useMemo(() => {
    return displayedWishlist
      .filter(item => !item.isBought)
      .reduce((sum, item) => sum + item.price, 0);
  }, [displayedWishlist]);

  const displayedTotalBought = useMemo(() => {
    return displayedWishlist
      .filter(item => item.isBought)
      .reduce((sum, item) => sum + item.price, 0);
  }, [displayedWishlist]);

  // Статистика по деньгам для настроек (по всем категориям без фильтрации)
  const moneyStats = useMemo(() => {
    const currency = displayCurrency;
    const byCategoryMap = new Map<string, { total: number; bought: number; count: number; boughtCount: number }>();
    let totalAll = 0;
    let totalBought = 0;
    for (const it of wishlist) {
      totalAll += it.price;
      if (it.isBought) totalBought += it.price;
      const key = it.category && it.category.trim() ? it.category : 'Без категории';
      const prev = byCategoryMap.get(key) || { total: 0, bought: 0, count: 0, boughtCount: 0 };
      prev.total += it.price;
      prev.count += 1;
      if (it.isBought) {
        prev.bought += it.price;
        prev.boughtCount += 1;
      }
      byCategoryMap.set(key, prev);
    }
    const totalsByCategory = Array.from(byCategoryMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([category, v]) => ({ category, ...v }));
    return { currency, totalAll, totalBought, totalsByCategory };
  }, [wishlist, displayCurrency]);

  // Используем useMemo для адаптивной панели управления
  const adaptiveControlPanel = useMemo(() => (
    <AdaptiveControlPanel
      themeMode={themeMode}
      systemTheme={systemTheme}
      onSetTheme={setTheme}
      supportsAutoTheme={supportsAutoTheme}
      onAuthModalOpen={onAuthModalOpen}
      isMobile={isMobile}
      isDesktopWide={isDesktopWide}
      moneyStats={moneyStats}
    />
  ), [themeMode, systemTheme, setTheme, supportsAutoTheme, onAuthModalOpen, isMobile, isDesktopWide, moneyStats]);

  // Контролы для мобильного заголовка: слева тема, справа профиль
  const mobileLeftControl = useMemo(() => (
    <AdaptiveControlPanel
      themeMode={themeMode}
      systemTheme={systemTheme}
      onSetTheme={setTheme}
      supportsAutoTheme={supportsAutoTheme}
      onAuthModalOpen={onAuthModalOpen}
      isMobile={true}
      isDesktopWide={isDesktopWide}
      moneyStats={moneyStats}
      mobileMode="theme-only"
    />
  ), [themeMode, systemTheme, setTheme, supportsAutoTheme, onAuthModalOpen, isDesktopWide, moneyStats]);

  const mobileRightControl = useMemo(() => (
    <AdaptiveControlPanel
      themeMode={themeMode}
      systemTheme={systemTheme}
      onSetTheme={setTheme}
      supportsAutoTheme={supportsAutoTheme}
      onAuthModalOpen={onAuthModalOpen}
      isMobile={true}
      isDesktopWide={isDesktopWide}
      moneyStats={moneyStats}
      mobileMode="profile-only"
    />
  ), [themeMode, systemTheme, setTheme, supportsAutoTheme, onAuthModalOpen, isDesktopWide, moneyStats]);

  // Стабилизуем обработчики, чтобы не триггерить children
  const handleShareOpen = useCallback(() => setIsShareModalOpen(true), []);
  const handleShowSortDropdown = useCallback((v: boolean) => setShowSortDropdown(v), []);
  const handleSetSortBy = useCallback((v: typeof sortBy) => setSortBy(v), [setSortBy]);
  const handleSetSearchQuery = useCallback((v: string) => setSearchQuery(v), [setSearchQuery]);

  const stableExchangeRates = useMemo(() => exchangeRates || {}, [exchangeRates]);

  if (sortBy === 'default') {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext 
          items={displayedWishlist.map(item => item.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className={`min-h-screen flex flex-col items-center justify-start py-6 sm:py-12 px-2 sm:px-4 ${themeConfig.background} transition-colors duration-200`}>
            {/* Адаптивная панель управления */}
            <div className={`fixed top-4 sm:top-12 right-4 sm:right-6 z-40 ${isMobile ? 'hidden' : 'block'}`}>
              {adaptiveControlPanel}
            </div>
            {/* Заголовок */}
            <Header adaptiveControlPanel={adaptiveControlPanel} mobileLeftControl={mobileLeftControl} mobileRightControl={mobileRightControl} isSidebarOpen={isSidebarOpen} />
            {/* Основной контент-карта */}
            <ListCard
              themeCardClass={themeConfig.cardBackground}
              categories={categories}
              activeCategory={activeCategory}
              activeFilter={activeFilter}
              setActiveCategory={setActiveCategory}
              setActiveFilter={setActiveFilter}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleCategoryDeleteClick}
              onRenameCategory={handleRenameCategory}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              onAddItem={handleAddItem}
              wishlist={wishlist}
              displayedWishlist={displayedWishlist}
              searchQuery={searchQuery}
              setSearchQuery={handleSetSearchQuery}
              sortBy={sortBy}
              setSortBy={handleSetSortBy}
              showSortDropdown={showSortDropdown}
              setShowSortDropdown={handleShowSortDropdown}
              isMobile={isMobile}
              onShareOpen={handleShareOpen}
              editingItemId={editingItemId}
              onToggleBought={handleToggleBought}
              onDeleteItemClick={handleDeleteItemClick}
              onUpdateItem={handleUpdateItem}
              onEditClick={handleEditClick}
              onCancelEdit={handleCancelEdit}
              displayCurrency={displayCurrency}
              exchangeRates={stableExchangeRates}
              selectedItemIds={selectedItemIds}
              onToggleSelected={handleToggleSelected}
              bulkSelectedItemIds={bulkSelectedItemIds}
              onToggleBulkSelected={handleToggleBulkSelected}
              onMoveItem={handleMoveItem}
              displayedTotalUnbought={displayedTotalUnbought}
              displayedTotalBought={displayedTotalBought}
            />
          </div>
          {/* Кнопка "Наверх" */}
          <ScrollToTopButton isMobile={isMobile} show={showScrollButton} onClick={scrollToTop} />
          {/* Калькулятор */}
          <CalculatorOverlay
            visible={selectedCount > 0}
            position={calculatorPosition}
            selectedCount={selectedCount}
            selectedItems={selectedItems}
            selectedTotal={selectedTotal}
            displayCurrency={displayCurrency}
            onClear={clearCalculator}
          />
          {/* Модальные окна */}
          <ConfirmDeleteModal
            open={isDeleteModalOpen}
            itemName={itemToDelete?.name}
            isDeleting={isDeleting}
            onCancel={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
          />
          {/* Модальное окно для массового удаления */}
          {isBulkDeleteModalOpen && (
            <BulkDeleteModal
              isOpen={isBulkDeleteModalOpen}
              selectedItems={bulkSelectedItems}
              isDeleting={isBulkDeleting}
              onConfirm={handleBulkDeleteConfirm}
              onCancel={handleBulkDeleteCancel}
            />
          )}
          {/* Модальное окно удаления категории */}
          <CategoryDeleteModal
            isOpen={isCategoryDeleteModalOpen}
            categoryName={categoryToDelete}
            itemsCount={categoryToDelete ? wishlist.filter(item => item.category === categoryToDelete).length : 0}
            isDeleting={isDeletingCategory}
            onConfirm={handleCategoryDeleteConfirm}
            onCancel={handleCategoryDeleteCancel}
          />
          {/* Модалка шаринга */}
          {isShareModalOpen && (
            <ShareWishlistModal
              isOpen={isShareModalOpen}
              items={wishlist.filter(item => !item.isBought)}
              authorName={user?.email || undefined}
              onClose={() => {
                setIsShareModalOpen(false);
                // После закрытия модалки — перезагрузим список ссылок, если открыт список менеджера (через событие)
                window.dispatchEvent(new CustomEvent('shareLinksUpdated'));
              }}
            />
          )}
          {/* Панель массовых действий */}
          <BulkActionBar
            selectedItems={bulkSelectedItems}
            categories={categories}
            isDeleting={isBulkDeleting}
            isMoving={isBulkMoving}
            onDelete={handleBulkDelete}
            onMoveToCategory={handleBulkMoveToCategory}
            onClearSelection={clearBulkSelection}
            isMobile={isMobile}
            onCreateCategory={handleAddCategory}
          />
          {/* Модальное окно справки */}
          <HelpModal
            isOpen={isHelpModalOpen}
            onClose={() => setIsHelpModalOpen(false)}
          />
        </SortableContext>
      </DndContext>
    );
  }

  return (
      <>
        <div className={`min-h-screen flex flex-col items-center justify-start py-6 sm:py-12 px-2 sm:px-4 ${themeConfig.background} transition-colors duration-200`}>
          <div className={`fixed top-4 sm:top-12 right-4 sm:right-6 z-40 ${isMobile ? 'hidden' : 'block'}`}>
            {adaptiveControlPanel}
          </div>
          <Header adaptiveControlPanel={adaptiveControlPanel} mobileLeftControl={mobileLeftControl} mobileRightControl={mobileRightControl} isSidebarOpen={isSidebarOpen} />
          <ListCard
            themeCardClass={themeConfig.cardBackground}
            categories={categories}
            activeCategory={activeCategory}
            activeFilter={activeFilter}
            setActiveCategory={setActiveCategory}
            setActiveFilter={setActiveFilter}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleCategoryDeleteClick}
            onRenameCategory={handleRenameCategory}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            onAddItem={handleAddItem}
            wishlist={wishlist}
            displayedWishlist={displayedWishlist}
            searchQuery={searchQuery}
            setSearchQuery={handleSetSearchQuery}
            sortBy={sortBy}
            setSortBy={handleSetSortBy}
            showSortDropdown={showSortDropdown}
            setShowSortDropdown={handleShowSortDropdown}
            isMobile={isMobile}
            onShareOpen={handleShareOpen}
            editingItemId={editingItemId}
            onToggleBought={handleToggleBought}
            onDeleteItemClick={handleDeleteItemClick}
            onUpdateItem={handleUpdateItem}
            onEditClick={handleEditClick}
            onCancelEdit={handleCancelEdit}
            displayCurrency={displayCurrency}
            exchangeRates={stableExchangeRates}
            selectedItemIds={selectedItemIds}
            onToggleSelected={handleToggleSelected}
            bulkSelectedItemIds={bulkSelectedItemIds}
            onToggleBulkSelected={handleToggleBulkSelected}
            onMoveItem={handleMoveItem}
            displayedTotalUnbought={displayedTotalUnbought}
            displayedTotalBought={displayedTotalBought}
          />
        </div>
        <ScrollToTopButton isMobile={isMobile} show={showScrollButton} onClick={scrollToTop} />
        <CalculatorOverlay
          visible={selectedCount > 0}
          position={calculatorPosition}
          selectedCount={selectedCount}
          selectedItems={selectedItems}
          selectedTotal={selectedTotal}
          displayCurrency={displayCurrency}
          onClear={clearCalculator}
        />
        <ConfirmDeleteModal
          open={isDeleteModalOpen}
          itemName={itemToDelete?.name}
          isDeleting={isDeleting}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
        {isBulkDeleteModalOpen && (
          <BulkDeleteModal
            isOpen={isBulkDeleteModalOpen}
            selectedItems={bulkSelectedItems}
            isDeleting={isBulkDeleting}
            onConfirm={handleBulkDeleteConfirm}
            onCancel={handleBulkDeleteCancel}
          />
        )}
        <CategoryDeleteModal
          isOpen={isCategoryDeleteModalOpen}
          categoryName={categoryToDelete}
          itemsCount={categoryToDelete ? wishlist.filter(item => item.category === categoryToDelete).length : 0}
          isDeleting={isDeletingCategory}
          onConfirm={handleCategoryDeleteConfirm}
          onCancel={handleCategoryDeleteCancel}
        />
        {isShareModalOpen && (
          <ShareWishlistModal
            isOpen={isShareModalOpen}
            items={wishlist.filter(item => !item.isBought)}
            authorName={user?.email || undefined}
            onClose={() => {
              setIsShareModalOpen(false);
              window.dispatchEvent(new CustomEvent('shareLinksUpdated'));
            }}
          />
        )}
        <BulkActionBar
          selectedItems={bulkSelectedItems}
          categories={categories}
          isDeleting={isBulkDeleting}
          isMoving={isBulkMoving}
          onDelete={handleBulkDelete}
          onMoveToCategory={handleBulkMoveToCategory}
          onClearSelection={clearBulkSelection}
          isMobile={isMobile}
          onCreateCategory={handleAddCategory}
        />
        <HelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
      </>
  );
}; 