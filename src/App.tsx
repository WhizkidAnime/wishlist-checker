import React, { useState, useMemo, useEffect } from 'react'
import './App.css'
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { AddItemForm } from './components/AddItemForm';
import { WishlistItem } from './components/WishlistItem';
import { SearchAndSort } from './components/SearchAndSort';
import { CalculatorPopup } from './components/CalculatorPopup';
import { ConfirmModals } from './components/ConfirmModals';
import { CategoryTabs } from './components/CategoryTabs';
import { ThemeToggle } from './components/ThemeToggle';

import { useWishlist } from './hooks/useWishlist';
import { useSelection } from './hooks/useSelection';
import { useCalculatorPosition } from './hooks/useCalculatorPosition';
import { useResponsive } from './hooks/useResponsive';
import { useImportExport } from './hooks/useImportExport';
import { useDeleteModal } from './hooks/useDeleteModal';
import { useDndSensors } from './hooks/useDndSensors';
import { useCategories } from './hooks/useCategories';
import { useTheme } from './hooks/useTheme';

function App() {
  const [displayCurrency] = useState<string>('RUB');
  const [exchangeRates] = useState<Record<string, number> | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Хук для управления темой
  const { theme, toggleTheme, getThemeConfig } = useTheme();
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
    totalUnbought,
    totalBought,
    handleAddItem,
    handleUpdateItem,
    handleToggleBought,
    handleMoveItem,
    handleDragEnd,
    handleDeleteItem,
    handleEditClick,
    handleCancelEdit
  } = useWishlist();

  const {
    activeCategory,
    setActiveCategory,
    categories,
    filterByCategory,
    handleAddCategory,
    resetCategoryIfNeeded
  } = useCategories(wishlist);

  // Применяем фильтры: если есть поиск - ищем по всем товарам, иначе фильтруем по категории
  const displayedWishlist = useMemo(() => {
    if (searchQuery.trim()) {
      // При поиске игнорируем фильтр по категории и ищем по всем товарам
      return getFilteredAndSortedItems(wishlist);
    } else {
      // Без поиска применяем фильтр по категории
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
    clearSelection,
    removeFromSelection
  } = useSelection(wishlist);

  const {
    calculatorPosition,
    setCalculatorPosition,
    setFirstButtonRef,
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
  } = useImportExport(wishlist, setWishlist);

  const {
    isDeleteModalOpen,
    itemToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel
  } = useDeleteModal(handleDeleteItem, removeFromSelection);

  const sensors = useDndSensors();

  // Расширенная функция toggleSelected с поддержкой позиционирования калькулятора
  const handleToggleSelected = (id: string | number, buttonElement?: HTMLElement) => {
    const wasSelected = selectedItemIds.includes(id);
    baseHandleToggleSelected(id);
    
    // Если выбираем первый товар - показываем калькулятор
    if (!wasSelected && selectedItemIds.length === 0) {
      showCalculator();
    }
    
    // Если убираем последний товар - скрываем калькулятор
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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext 
        items={sortBy === 'default' ? displayedWishlist.map(item => item.id) : []} 
        strategy={verticalListSortingStrategy} 
        disabled={sortBy !== 'default'}
      >
        <div className={`min-h-screen flex flex-col items-center justify-start py-6 sm:py-12 px-2 sm:px-4 ${themeConfig.background} transition-colors duration-200`}>
          
          {/* Переключатель темы для десктопа - всегда в правом верхнем углу */}
          <div className="hidden sm:block fixed top-6 right-6 z-30">
            <ThemeToggle 
              theme={theme} 
              onToggleTheme={toggleTheme}
              isMobile={false}
            />
          </div>

          {/* Заголовок с тумблером для мобильных */}
          <div className="relative w-full max-w-4xl flex justify-center items-center mb-6 sm:mb-8">
            <h1 className={`text-2xl sm:text-3xl font-semibold text-center ${themeConfig.text} transition-colors duration-200`}>
              Wishlist checker
            </h1>
            
            {/* Переключатель темы для мобильных - всегда рядом с заголовком */}
            <div className="sm:hidden absolute right-0 top-1/2 transform -translate-y-1/2">
              <ThemeToggle 
                theme={theme} 
                onToggleTheme={toggleTheme}
                isMobile={true}
              />
            </div>
          </div>
          
          <div className={`w-full max-w-4xl ${themeConfig.cardBackground} rounded-3xl shadow-lg p-4 sm:p-8 relative overflow-hidden transition-colors duration-200`}>
            
            <AddItemForm 
              onAddItem={handleAddItem} 
              existingCategories={categories}
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
          className={`fixed bottom-8 left-5 z-20 p-3 bg-gray-800 dark:bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-500 focus:outline-none transition-all duration-300 ease-in-out ${showScrollButton ? 'opacity-50 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
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
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={handleDeleteCancel}
          showImportSuccessToast={showImportSuccessToast}
        />
      </SortableContext>
    </DndContext>
  )
}

export default App
