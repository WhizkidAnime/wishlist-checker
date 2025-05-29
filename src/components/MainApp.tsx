import { useState, useEffect, useMemo } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { AddItemForm } from './AddItemForm';
import { WishlistItem } from './WishlistItem';
import { SearchAndSort } from './SearchAndSort';
import { CalculatorPopup } from './CalculatorPopup';
import { ConfirmModals } from './ConfirmModals';
import { CategoryTabs } from './CategoryTabs';
import { ThemeToggle } from './ThemeToggle';
import { UserProfile } from './UserProfile';
import { BulkActionBar } from './BulkActionBar';
import { BulkDeleteModal } from './BulkDeleteModal';

import { useWishlist } from '../hooks/useWishlist';
import { useSelection } from '../hooks/useSelection';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { useCalculatorPosition } from '../hooks/useCalculatorPosition';
import { useResponsive } from '../hooks/useResponsive';
import { useImportExport } from '../hooks/useImportExport';
import { useDeleteModal } from '../hooks/useDeleteModal';
import { useDndSensors } from '../hooks/useDndSensors';
import { useCategories } from '../hooks/useCategories';
import { useTheme } from '../hooks/useTheme';
import { useBulkActions } from '../hooks/useBulkActions';
import { useAuth } from '../hooks/useAuth';

interface MainAppProps {
  triggerSync: () => Promise<void>;
  deleteWishlistItem?: (itemId: string | number) => Promise<boolean>;
  onAuthModalOpen: () => void;
}

export const MainApp: React.FC<MainAppProps> = ({ 
  triggerSync, 
  deleteWishlistItem,
  onAuthModalOpen 
}) => {
  const [displayCurrency] = useState<string>('RUB');
  const [exchangeRates] = useState<Record<string, number> | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Получаем userId из контекста аутентификации  
  const { user } = useAuth();
  const userId = user?.id || null;

  // Хук для управления темой
  const { 
    themeMode, 
    systemTheme, 
    getThemeConfig,
    supportsAutoTheme,
    setTheme
  } = useTheme();
  const themeConfig = getThemeConfig();

  // Хуки для управления состоянием
  const {
    wishlist,
    setWishlist,
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
    handleCancelEdit
  } = useWishlist(triggerSync, true, deleteWishlistItem); // isAuthenticated = true

  const {
    activeCategory,
    setActiveCategory,
    categories,
    filterByCategory,
    handleAddCategory,
    resetCategoryIfNeeded
  } = useCategories(wishlist, triggerSync, true); // isAuthenticated = true

  // Применяем фильтры: если есть поиск - ищем по всем товарам, иначе фильтруем по категории
  const displayedWishlist = useMemo(() => {
    if (searchQuery.trim()) {
      return getFilteredAndSortedItems(wishlist);
    } else {
      const categoryFiltered = filterByCategory(wishlist);
      return getFilteredAndSortedItems(categoryFiltered);
    }
  }, [wishlist, activeCategory, searchQuery, sortBy, filterByCategory, getFilteredAndSortedItems]);

  // Сбрасываем категорию если она больше не существует
  useEffect(() => {
    resetCategoryIfNeeded();
  }, [categories, resetCategoryIfNeeded]);

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

  const { isMobile, showScrollButton, scrollToTop } = useResponsive();

  const {
    isConfirmModalOpen,
    showImportSuccessToast,
    handleExport,
    handleImport,
    handleModalConfirm,
    handleModalClose
  } = useImportExport(wishlist, setWishlist, triggerSync, true); // isAuthenticated = true

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

  // Используем useMemo для дочерних компонентов, чтобы предотвратить лишние рендеры
  const themeToggleElement = useMemo(() => (
    <ThemeToggle 
      themeMode={themeMode}
      systemTheme={systemTheme}
      onSetTheme={setTheme}
      isMobile={false} // Для десктопа
      supportsAutoTheme={supportsAutoTheme}
    />
  ), [themeMode, systemTheme, setTheme, supportsAutoTheme]);

  const userProfileElement = useMemo(() => (
    <UserProfile onSignInClick={onAuthModalOpen} />
  ), [onAuthModalOpen]);

  const mobileThemeToggleElement = useMemo(() => (
    <ThemeToggle 
      themeMode={themeMode}
      systemTheme={systemTheme}
      onSetTheme={setTheme}
      isMobile={true} // Для мобильных
      supportsAutoTheme={supportsAutoTheme}
    />
  ), [themeMode, systemTheme, setTheme, supportsAutoTheme]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext 
        items={sortBy === 'default' ? displayedWishlist.map(item => item.id) : []} 
        strategy={verticalListSortingStrategy} 
        disabled={sortBy !== 'default'}
      >
        <div className={`min-h-screen flex flex-col items-center justify-start py-6 sm:py-12 px-2 sm:px-4 ${themeConfig.background} transition-colors duration-200`}>
          
          {/* Десктопная панель управления - статичная */}
          <div className="hidden sm:flex fixed top-11 right-4 z-50 items-center gap-2 p-2 
                        bg-theme-card/95 dark:bg-theme-card/80 border border-gray-200 dark:border-gray-600 
                        shadow-lg backdrop-blur-md rounded-3xl">
            {themeToggleElement}
            {userProfileElement}
          </div>

          {/* Заголовок */}
          <div className="relative w-full max-w-4xl mb-6 sm:mb-8 z-10">
            {/* Мобильная версия - панель управления сверху */}
            <div className="sm:hidden">
              <div className="flex justify-between items-center mb-4">
                {/* Пустой div для выравнивания заголовка по центру, если нужно */} 
                {/* <div></div> */}
                <h1 className="text-3xl font-bold text-center text-theme-text flex-grow">
                  Wishlist checker
                </h1>
                <div className="flex items-center gap-2">
                  {userProfileElement} {/* Профиль всегда тут */}
                  {mobileThemeToggleElement} {/* Переключатель темы */}
                </div>
              </div>
            </div>
            
            {/* Десктопная версия - заголовок */}
            <div className="hidden sm:block text-center">
              <h1 className="text-4xl font-bold text-theme-text">
                Wishlist checker
              </h1>
            </div>
          </div>
          
          <div className={`w-full max-w-4xl ${themeConfig.cardBackground} rounded-3xl shadow-lg p-4 sm:p-8 relative z-10 transition-colors duration-200`}>
            
            <AddItemForm 
              onAddItem={handleAddItem} 
              existingCategories={categories}
              disabled={false}
            />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 mb-4 gap-4 border-b pb-4 border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-black dark:text-theme-secondary whitespace-nowrap">Список желаний</h2>
            </div>

            <CategoryTabs
              items={wishlist}
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onAddCategory={handleAddCategory}
            />
            
            <SearchAndSort
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showSortDropdown={showSortDropdown}
              setShowSortDropdown={setShowSortDropdown}
              isMobile={isMobile}
              onExport={handleExport}
              onImport={handleImport}
              itemsCount={displayedWishlist.length}
            />

            {displayedWishlist.length > 0 ? (
              <div className="space-y-0 border-t border-gray-200">
                {displayedWishlist.map((item, index) => (
                  <WishlistItem
                    key={item.id}
                    item={item}
                    onToggleBought={handleToggleBought}
                    onDeleteItem={handleDeleteItemClick}
                    onUpdateItem={handleUpdateItem}
                    isEditing={editingItemId === item.id}
                    onEditClick={handleEditClick}
                    onCancelEdit={handleCancelEdit}
                    displayCurrency={displayCurrency}
                    exchangeRates={exchangeRates || {}}
                    isSelected={selectedItemIds.includes(item.id)}
                    onToggleSelected={handleToggleSelected}
                    isBulkSelected={bulkSelectedItemIds.includes(item.id)}
                    onToggleBulkSelected={handleToggleBulkSelected}
                    isMobile={isMobile}
                    onMoveItem={handleMoveItem}
                    index={index}
                    totalItems={displayedWishlist.length}
                    comment={item.comment}
                    existingCategories={categories}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8 border-t border-gray-200 dark:border-gray-600">
                {searchQuery ? 'Ничего не найдено' : 'Список желаний пуст. Добавьте что-нибудь!'}
              </div>
            )}

            {displayedWishlist.length > 0 && (
              <div className="mt-6 sm:mt-8 border-t border-gray-200 dark:border-gray-600 pt-4 sm:pt-6">
                <div className="flex flex-col gap-1 sm:text-right sm:ml-auto">
                  <div className="flex justify-end">
                    <div className="text-lg sm:text-xl font-semibold text-black dark:text-theme-secondary">
                      Итого некупленных: <span className="text-black dark:text-theme-secondary">{displayedTotalUnbought.toLocaleString(undefined, { maximumFractionDigits: 2 })} {displayCurrency}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="text-base sm:text-lg font-medium text-black dark:text-theme-secondary">
                      Итого купленных: <span className="text-black dark:text-theme-secondary">{displayedTotalBought.toLocaleString(undefined, { maximumFractionDigits: 2 })} {displayCurrency}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Кнопка "Наверх" */}
        <button
          onClick={scrollToTop}
          aria-label="Вернуться к началу"
          className={`fixed bottom-8 left-5 z-40 p-3 bg-gray-800 dark:bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-500 focus:outline-none transition-all duration-300 ease-in-out ${showScrollButton ? 'opacity-50 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Калькулятор */}
        {calculatorPosition && selectedCount > 0 && (
          <CalculatorPopup
            selectedCount={selectedCount}
            selectedItems={selectedItems}
            selectedTotal={selectedTotal}
            displayCurrency={displayCurrency}
            position={calculatorPosition}
            onClear={clearCalculator}
          />
        )}

        {/* Модальные окна */}
        <ConfirmModals
          isImportModalOpen={isConfirmModalOpen}
          onImportConfirm={handleModalConfirm}
          onImportCancel={handleModalClose}
          isDeleteModalOpen={isDeleteModalOpen}
          itemToDelete={itemToDelete}
          isDeleting={isDeleting}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={handleDeleteCancel}
          showImportSuccessToast={showImportSuccessToast}
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
        />
      </SortableContext>
    </DndContext>
  );
}; 