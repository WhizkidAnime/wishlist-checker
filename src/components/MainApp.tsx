import { useState, useEffect, useMemo } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { AddItemForm } from './AddItemForm';
import { WishlistItem } from './WishlistItem';
import { SearchAndSort } from './SearchAndSort';
import { CalculatorPopup } from './CalculatorPopup';
import { CategoryTabs } from './CategoryTabs';
import { ThemeToggle } from './ThemeToggle';
import { UserProfile } from './UserProfile';
import { BulkActionBar } from './BulkActionBar';
import { BulkDeleteModal } from './BulkDeleteModal';
import { CategoryDeleteModal } from './CategoryDeleteModal';
import { HelpModal } from './ui/HelpModal';

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

interface MainAppProps {
  triggerSync: (force?: boolean) => Promise<{ success: boolean; message: string; }>;
  onAuthModalOpen: () => void;
}

export const MainApp: React.FC<MainAppProps> = ({ 
  triggerSync, 
  onAuthModalOpen 
}) => {
  const [displayCurrency] = useState<string>('RUB');
  const [exchangeRates] = useState<Record<string, number> | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string>('');
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

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
    handleCancelEdit
  } = useWishlist(triggerSync, isAuthenticated);

  const {
    activeCategory,
    setActiveCategory,
    categories,
    filterByCategory,
    handleAddCategory,
    handleDeleteCategory,
    resetCategoryIfNeeded
  } = useCategories(wishlist, triggerSync, isAuthenticated, userId);

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
          
          {/* Простая панель управления для десктопа */}
          <div className="hidden sm:block fixed top-4 right-4 z-50">
            <div className="flex items-center gap-2">
              {themeToggleElement}
              {userProfileElement}
            </div>
          </div>

          {/* Заголовок */}
          <div className="relative w-full max-w-4xl mb-6 sm:mb-8 z-30">
            {/* Мобильная версия - простая панель управления сверху */}
            <div className="sm:hidden">
              <div className="flex justify-between items-center mb-4">
                {/* Кнопка справки слева */}
                <button
                  onClick={() => setIsHelpModalOpen(true)}
                  className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  aria-label="Справка по приложению"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                <h1 className="text-3xl font-bold text-center text-theme-text flex-grow">
                  Wishlist checker
                </h1>
                
                {/* Простая панель управления справа */}
                <div className="flex items-center gap-2">
                  {userProfileElement}
                  {mobileThemeToggleElement}
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
              onDeleteCategory={handleCategoryDeleteClick}
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
          className={`fixed bottom-8 left-5 z-40 p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none transition-all duration-300 ease-in-out ${showScrollButton ? 'opacity-50 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
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
        {/* Модальное окно подтверждения удаления */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <div 
              className="rounded-xl shadow-xl w-full max-w-md p-6 mx-auto"
              style={{ backgroundColor: 'var(--color-card-background)' }}
            >
              <h3 className="text-lg font-semibold text-black dark:text-theme-secondary mb-2">Подтвердите удаление</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Вы уверены, что хотите удалить "{itemToDelete?.name}"? Это действие необратимо.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
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
        )}

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

        {/* Модальное окно справки */}
        <HelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
      </SortableContext>
    </DndContext>
  );
}; 