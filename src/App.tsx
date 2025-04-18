import { useState, useEffect, useMemo } from 'react'
import './App.css'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { AddItemForm } from './components/AddItemForm';
import { WishlistItem } from './components/WishlistItem';
// import { CurrencySelector } from './components/CurrencySelector';
import { WishlistItem as WishlistItemType } from './types/wishlistItem';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorageUtils';
// import { fetchExchangeRates } from './utils/exchangeRateUtils';

const LOCAL_STORAGE_KEY = 'wishlistApp';
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/RUB';
const MOBILE_BREAKPOINT = 640;
const SCROLL_THRESHOLD = 100;

function App() {
  const [wishlist, setWishlist] = useState<WishlistItemType[]>(() => loadFromLocalStorage(LOCAL_STORAGE_KEY) || []);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<string>('RUB');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<(string | number)[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [dataToImport, setDataToImport] = useState<WishlistItemType[] | null>(null);
  const [showImportSuccessToast, setShowImportSuccessToast] = useState(false);

  // useEffect(() => {
  //   fetchExchangeRates(EXCHANGE_RATE_API_URL)
  //     .then(rates => {
  //       setExchangeRates(rates);
  //     })
  //     .catch(error => console.error("Ошибка загрузки курсов валют:", error));
  // }, []);

  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEY, wishlist);
  }, [wishlist]);

  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobileCheck);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > SCROLL_THRESHOLD;
      setShowScrollButton(shouldShow);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showImportSuccessToast) {
      timer = setTimeout(() => {
        setShowImportSuccessToast(false);
      }, 3000); // Скрываем через 3 секунды
    }
    // Очистка таймера при размонтировании или если уведомление закрылось раньше
    return () => clearTimeout(timer);
  }, [showImportSuccessToast]);

  const handleAddItem = (newItem: Omit<WishlistItemType, 'id' | 'isBought'>) => {
    const itemToAdd: WishlistItemType = { 
      ...newItem, 
      id: Date.now().toString(),
      isBought: false 
    };
    setWishlist([...wishlist, itemToAdd]);
  };

  const handleDeleteItem = (id: string | number) => {
    setWishlist(wishlist.filter(item => item.id !== id));
    setSelectedItemIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  const handleEditClick = (id: string | number) => {
    setEditingItemId(id);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleUpdateItem = (updatedItem: WishlistItemType) => {
    setWishlist(wishlist.map(item => (item.id === updatedItem.id ? updatedItem : item)));
    setEditingItemId(null);
  };

  const handleToggleBought = (id: string | number) => {
    setWishlist(currentWishlist => 
      currentWishlist.map(item => 
        item.id === id ? { ...item, isBought: !item.isBought } : item
      )
    );
  };

  const handleToggleSelected = (id: string | number) => {
    setSelectedItemIds(prevSelectedIds =>
      prevSelectedIds.includes(id)
        ? prevSelectedIds.filter(selectedId => selectedId !== id)
        : [...prevSelectedIds, id]
    );
  };

  const handleMoveItem = (id: string | number, direction: 'up' | 'down') => {
    const currentIndex = wishlist.findIndex(item => item.id === id);
    if (currentIndex === -1) return; 

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < wishlist.length) {
      setWishlist(currentList => arrayMove(currentList, currentIndex, newIndex));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150, 
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setWishlist((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex); 
      });
    }
  };

  const filteredAndSortedWishlist = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    const filtered = query 
      ? wishlist.filter(item => 
          item.name.toLowerCase().includes(query) || 
          (item.itemType && item.itemType.toLowerCase().includes(query))
        )
      : wishlist;

    const unbought: WishlistItemType[] = [];
    const bought: WishlistItemType[] = [];
    filtered.forEach(item => {
      if (item.isBought) {
        bought.push(item);
      } else {
        unbought.push(item);
      }
    });
    return [...unbought, ...bought];
  }, [wishlist, searchQuery]);

  const totalUnbought = useMemo(() => {
    return wishlist
      .filter(item => !item.isBought)
      .reduce((sum, item) => sum + item.price, 0);
  }, [wishlist]);

  const totalBought = useMemo(() => {
    return wishlist
      .filter(item => item.isBought)
      .reduce((sum, item) => sum + item.price, 0);
  }, [wishlist]);

  const selectedTotal = useMemo(() => {
    return wishlist
      .filter(item => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  }, [wishlist, selectedItemIds]);

  const selectedCount = selectedItemIds.length;
  const selectedItems = wishlist.filter(item => selectedItemIds.includes(item.id));

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Вспомогательная функция для правильного склонения слова "элемент" (Обновленная)
  function getItemsCountText(count: number): string {
    console.log('[getItemsCountText] Input count:', count);
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
    
    console.log('[getItemsCountText] Result:', result);
    return result;
  }

  // <<< Функция экспорта в JSON >>>
  const handleExport = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(wishlist, null, 2) // Используем null, 2 для красивого форматирования
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "wishlist.json";
      link.click();
      link.remove(); // Убираем ссылку после клика
    } catch (error) {
      console.error("Ошибка при экспорте wishlist:", error);
      alert("Не удалось экспортировать данные."); // Простое уведомление об ошибке
    }
  };

  // <<< Функция импорта из JSON - изменена >>>
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("Не удалось прочитать файл как текст.");
        
        const parsedData = JSON.parse(text);

        if (!Array.isArray(parsedData)) throw new Error("Импортированный файл должен содержать массив JSON.");
        
        const isValidStructure = parsedData.every(
          (item: any) => 
            typeof item === 'object' &&
            item !== null &&
            'id' in item && 
            'name' in item && 
            'price' in item && typeof item.price === 'number' &&
            'currency' in item && typeof item.currency === 'string' &&
            'isBought' in item && typeof item.isBought === 'boolean'
        );

        if (!isValidStructure) throw new Error("Структура данных в файле не соответствует формату вишлиста.");
        
        // <<< Вместо window.confirm: сохраняем данные и открываем модальное окно >>>
        setDataToImport(parsedData as WishlistItemType[]); 
        setIsConfirmModalOpen(true);

      } catch (error) {
        console.error("Ошибка при импорте/парсинге файла:", error);
        alert(`Ошибка импорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      } finally {
        event.target.value = ''; 
      }
    };

    reader.onerror = (e) => {
      console.error("Ошибка чтения файла:", e);
      alert("Не удалось прочитать файл.");
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  // <<< Обработчики для модального окна >>>
  const handleModalConfirm = () => {
    if (dataToImport) {
      setWishlist(dataToImport); 
      setShowImportSuccessToast(true);
    }
    setIsConfirmModalOpen(false);
    setDataToImport(null);
  };

  const handleModalClose = () => {
    setIsConfirmModalOpen(false);
    setDataToImport(null);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={filteredAndSortedWishlist.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-screen flex flex-col items-center justify-start py-6 sm:py-12 px-2 sm:px-4 bg-gray-50">
          <h1 className="text-2xl sm:text-3xl font-semibold text-center text-gray-800 mb-6 sm:mb-8">Wishlist checker</h1>
          
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg p-4 sm:p-8 relative overflow-hidden">
            <AddItemForm onAddItem={handleAddItem} />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 mb-4 gap-4 border-b pb-4 border-gray-200">
              <h2 className="text-xl sm:text-2xl font-semibold text-black">Список желаний</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-48">
                  <input 
                    type="text"
                    placeholder="Поиск по названию/типу..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      onClick={handleExport}
                      className="flex-1 sm:flex-none px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors duration-150"
                    >
                      Экспорт
                    </button>
                    {/* Скрытый input для импорта */}
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleImport}
                      style={{ display: 'none' }} // Скрываем инпут
                      id="import-file-input"
                    />
                    <button 
                      onClick={() => document.getElementById('import-file-input')?.click()} // Клик по скрытому инпуту
                      className="flex-1 sm:flex-none px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors duration-150"
                    >
                      Импорт
                    </button>
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap text-right sm:text-left">
                  {wishlist.length} {getItemsCountText(wishlist.length)}
                </span>
              </div>
            </div>

            {filteredAndSortedWishlist.length > 0 ? (
              <div className="space-y-0 border-t border-gray-200">
                {filteredAndSortedWishlist.map((item, index) => (
                  <WishlistItem
                    key={item.id}
                    item={item}
                    onToggleBought={handleToggleBought}
                    onDeleteItem={handleDeleteItem}
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
                    totalItems={filteredAndSortedWishlist.length}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 border-t border-gray-200">
                {searchQuery ? 'Ничего не найдено' : 'Список желаний пуст. Добавьте что-нибудь!'}
              </div>
            )}

            {wishlist.length > 0 && (
              <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-4 sm:pt-6">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex sm:justify-start justify-end">
                      <div className="text-lg sm:text-xl font-semibold">
                        Итого некупленных: <span className="text-gray-800">{totalUnbought.toLocaleString(undefined, { maximumFractionDigits: 2 })} {displayCurrency}</span>
                      </div>
                    </div>
                    <div className="flex sm:justify-start justify-end">
                      <div className="text-base sm:text-lg font-medium text-gray-600">
                        Итого купленных: <span className="text-gray-700">{totalBought.toLocaleString(undefined, { maximumFractionDigits: 2 })} {displayCurrency}</span>
                      </div>
                    </div>
                  </div>

                  {selectedCount > 0 && (
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-sm sm:text-base">
                      <div className="font-semibold text-indigo-800 mb-2">
                        Выбрано для расчета: {selectedCount}
                      </div>
                      <div className="max-h-24 overflow-y-auto text-xs space-y-0.5 mb-2 pr-1">
                        {selectedItems.map(item => (
                          <div key={item.id} className="text-indigo-700 truncate" title={item.name}>{item.name}</div>
                        ))} 
                      </div>
                      <div className="text-base text-indigo-800 mt-1">
                        Сумма выбранных: <span className="font-medium text-indigo-900">{selectedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} {displayCurrency}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
        
        <button
          onClick={scrollToTop}
          aria-label="Вернуться к началу"
          className={`fixed bottom-8 left-5 z-20 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none transition-opacity duration-300 ease-in-out ${showScrollButton ? 'opacity-50 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* <<< Модальное окно подтверждения импорта >>> */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Подтвердите действие</h3>
              <p className="text-sm text-gray-600 mb-6">
                Вы уверены, что хотите заменить текущий список импортированным? Это действие необратимо.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors duration-150 ease-in-out"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleModalConfirm}
                  className="px-4 py-1.5 border border-transparent rounded-full text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none transition-colors duration-150 ease-in-out"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* <<< Уведомление (Toast) об успешном импорте >>> */}
        {showImportSuccessToast && (
          <div 
            className="fixed bottom-5 left-1/2 z-50 px-4 py-2 bg-green-600 text-white text-sm rounded-md shadow-lg animate-fade-in-out"
            role="alert"
          >
            Список успешно импортирован!
          </div>
        )}

      </SortableContext>
    </DndContext>
  )
}

export default App
