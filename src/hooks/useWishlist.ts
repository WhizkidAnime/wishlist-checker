import { useState, useEffect, useMemo, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { WishlistItem } from '../types/wishlistItem';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorageUtils';

const LOCAL_STORAGE_KEY = 'wishlistApp';

export const useWishlist = (
  triggerSync?: () => void, 
  isAuthenticated?: boolean, 
  deleteFromSupabase?: (itemId: string | number) => Promise<boolean>
) => {
  // Флаг для предотвращения автоматической синхронизации при удалении
  const skipNextSync = useRef(false);
  
  // Инициализация зависит от статуса аутентификации
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    if (isAuthenticated) {
      return loadFromLocalStorage(LOCAL_STORAGE_KEY) || [];
    }
    return [];
  });
  
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'type-asc' | 'price-asc' | 'price-desc'>('default');

  // Эффект для очистки данных при выходе из аккаунта
  useEffect(() => {
    if (isAuthenticated === false) {
      // Очищаем состояние при выходе
      setWishlist([]);
      setEditingItemId(null);
      setSearchQuery('');
      setSortBy('default');
      
      // Очищаем localStorage от персональных данных
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem('wishlistCategories');
      } catch (error) {
        console.warn('Не удалось очистить localStorage:', error);
      }
    } else if (isAuthenticated === true) {
      // Загружаем данные при входе
      const savedData = loadFromLocalStorage(LOCAL_STORAGE_KEY) || [];
      setWishlist(savedData);
    }
  }, [isAuthenticated]);

  // Слушатель обновлений данных из Supabase (только для аутентифицированных)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleDataUpdate = () => {
      const updatedData = loadFromLocalStorage(LOCAL_STORAGE_KEY) || [];
      setWishlist(updatedData);
    };

    window.addEventListener('wishlistDataUpdated', handleDataUpdate);
    return () => window.removeEventListener('wishlistDataUpdated', handleDataUpdate);
  }, [isAuthenticated]);

  // Сохранение только для аутентифицированных пользователей
  useEffect(() => {
    if (!isAuthenticated) return;
    
    saveToLocalStorage(LOCAL_STORAGE_KEY, wishlist);
    
    // Проверяем флаг skipNextSync перед запуском синхронизации
    if (skipNextSync.current) {
      skipNextSync.current = false; // Сбрасываем флаг
      return;
    }
    
    // Автоматически запускаем синхронизацию при изменениях
    if (triggerSync) {
      triggerSync();
    }
  }, [wishlist, triggerSync, isAuthenticated]);

  // Базовая функция фильтрации и сортировки (без категорий)
  const getFilteredAndSortedItems = (items: WishlistItem[]) => {
    const query = searchQuery.toLowerCase().trim();
    
    let filtered = query 
      ? items.filter(item => 
          item.name.toLowerCase().includes(query) || 
          (item.itemType && item.itemType.toLowerCase().includes(query))
        )
      : [...items];

    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'type-asc':
        filtered.sort((a, b) => {
          const typeA = a.itemType?.toLowerCase() || '';
          const typeB = b.itemType?.toLowerCase() || '';
          const typeCompare = typeA.localeCompare(typeB);
          if (typeCompare !== 0) {
            return typeCompare;
          }
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });
        break;
    }

    const unbought: WishlistItem[] = [];
    const bought: WishlistItem[] = [];
    filtered.forEach(item => {
      if (item.isBought) {
        bought.push(item);
      } else {
        unbought.push(item);
      }
    });
    return [...unbought, ...bought];
  };

  const filteredAndSortedWishlist = useMemo(() => {
    return getFilteredAndSortedItems(wishlist);
  }, [wishlist, searchQuery, sortBy]);

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

  const handleAddItem = (newItem: Omit<WishlistItem, 'id' | 'isBought'>) => {
    // Генерируем более уникальный ID с рандомным компонентом
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const itemToAdd: WishlistItem = { 
      ...newItem, 
      id: uniqueId,
      isBought: false 
    };
    setWishlist([itemToAdd, ...wishlist]);
  };

  const handleUpdateItem = (updatedItem: WishlistItem) => {
    setWishlist(wishlist.map(item => (item.id === updatedItem.id ? updatedItem : item)));
    setEditingItemId(null);
  };

  const handleToggleBought = (id: string | number) => {
    setWishlist(wishlist.map(item => 
      item.id === id ? { ...item, isBought: !item.isBought } : item
    ));
  };

  const handleMoveItem = (id: string | number, direction: 'up' | 'down') => {
    const currentIndex = wishlist.findIndex(item => item.id === id);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(wishlist.length - 1, currentIndex + 1);
    
    if (currentIndex !== newIndex) {
      setWishlist(currentList => arrayMove(currentList, currentIndex, newIndex));
    }
  };

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

  const handleDeleteItem = async (id: string | number): Promise<void> => {
    // Проверяем, есть ли элемент в списке
    const itemExists = wishlist.some(item => item.id === id);
    if (!itemExists) {
      return;
    }

    try {
      // Если есть функция удаления из Supabase и пользователь аутентифицирован
      if (deleteFromSupabase && isAuthenticated) {
        const deleteSuccess = await deleteFromSupabase(id);
        if (!deleteSuccess) {
          throw new Error('Не удалось удалить элемент из базы данных');
        }
      }
      
      // Устанавливаем флаг для пропуска следующей автоматической синхронизации
      skipNextSync.current = true;
      
      // Удаляем из локального состояния
      setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== id));
      
      // Отменяем редактирование если удаляется редактируемый элемент
      if (editingItemId === id) {
        setEditingItemId(null);
      }
      
      // Уведомляем компоненты об обновлении данных
      window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));
      
    } catch (error) {
      console.error('Ошибка при удалении элемента:', error);
      throw error;
    }
  };

  return {
    wishlist,
    setWishlist,
    editingItemId,
    setEditingItemId,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredAndSortedWishlist,
    getFilteredAndSortedItems,
    totalUnbought,
    totalBought,
    handleAddItem,
    handleUpdateItem,
    handleToggleBought,
    handleMoveItem,
    handleDragEnd,
    handleDeleteItem,
    handleEditClick: setEditingItemId,
    handleCancelEdit: () => setEditingItemId(null)
  };
}; 