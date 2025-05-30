import { useState, useEffect, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { WishlistItem } from '../types/wishlistItem';
import { supabase } from '../utils/supabaseClient';

export const useWishlist = (
  triggerSync?: (force?: boolean) => Promise<{ success: boolean; message: string; }>, 
  isAuthenticated?: boolean
) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'type-asc' | 'price-asc' | 'price-desc'>('default');
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка данных из Supabase
  const loadWishlistFromSupabase = async (userId: string) => {
    if (!supabase) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedItems: WishlistItem[] = (data || []).map(item => ({
        id: item.id,
        itemType: item.item_type || '',
        name: item.name,
        link: item.link || '',
        price: Number(item.price),
        currency: item.currency,
        isBought: item.is_bought,
        comment: item.comment || '',
        category: item.category || undefined
      }));

      setWishlist(convertedItems);
    } catch (error) {
      console.error('Ошибка загрузки данных из Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Эффект для загрузки данных при аутентификации
  useEffect(() => {
    if (isAuthenticated === false) {
      // Очищаем состояние при выходе
      setWishlist([]);
      setEditingItemId(null);
      setSearchQuery('');
      setSortBy('default');
    } else if (isAuthenticated === true && triggerSync) {
      // Загружаем данные при входе
      // Получаем userId из Supabase auth
      supabase?.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          loadWishlistFromSupabase(user.id);
        }
      });
    }
  }, [isAuthenticated, triggerSync]);

  // Слушатель обновлений (перезагрузка из Supabase)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleDataUpdate = () => {
      supabase?.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          loadWishlistFromSupabase(user.id);
        }
      });
    };

    window.addEventListener('wishlistDataUpdated', handleDataUpdate);
    return () => window.removeEventListener('wishlistDataUpdated', handleDataUpdate);
  }, [isAuthenticated]);

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

  const handleAddItem = async (newItem: Omit<WishlistItem, 'id' | 'isBought'>) => {
    if (!isAuthenticated || !supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const supabaseItem = {
        user_id: user.id,
        name: newItem.name,
        item_type: newItem.itemType || null,
        link: newItem.link || '',
        price: Number(newItem.price),
        currency: newItem.currency,
        is_bought: false,
        comment: newItem.comment || '',
        category: newItem.category || null,
        sort_order: 0
      };

      const { data, error } = await supabase
        .from('wishlist_items')
        .insert(supabaseItem)
        .select('*')
        .single();

      if (error) throw error;

      // Немедленно добавляем в локальное состояние для быстрого UI
      const convertedItem: WishlistItem = {
        id: data.id,
        itemType: data.item_type || '',
        name: data.name,
        link: data.link || '',
        price: Number(data.price),
        currency: data.currency,
        isBought: data.is_bought,
        comment: data.comment || '',
        category: data.category || undefined
      };

      setWishlist(prev => [convertedItem, ...prev]);
    } catch (error) {
      console.error('Ошибка добавления товара:', error);
    }
  };

  const handleUpdateItem = async (updatedItem: WishlistItem) => {
    if (!isAuthenticated || !supabase) return;

    try {
      const supabaseUpdate = {
        name: updatedItem.name,
        item_type: updatedItem.itemType || null,
        link: updatedItem.link || '',
        price: Number(updatedItem.price),
        currency: updatedItem.currency,
        is_bought: updatedItem.isBought,
        comment: updatedItem.comment || '',
        category: updatedItem.category || null
      };

      const { error } = await supabase
        .from('wishlist_items')
        .update(supabaseUpdate)
        .eq('id', updatedItem.id);

      if (error) throw error;

      // Обновляем локальное состояние
      setWishlist(prev => prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));
      setEditingItemId(null);
    } catch (error) {
      console.error('Ошибка обновления товара:', error);
    }
  };

  const handleToggleBought = async (id: string | number) => {
    if (!isAuthenticated || !supabase) return;

    try {
      const item = wishlist.find(item => item.id === id);
      if (!item) return;

      const newIsBought = !item.isBought;

      const { error } = await supabase
        .from('wishlist_items')
        .update({ is_bought: newIsBought })
        .eq('id', id);

      if (error) throw error;

      // Обновляем локальное состояние
      setWishlist(prev => prev.map(item => 
        item.id === id ? { ...item, isBought: newIsBought } : item
      ));
    } catch (error) {
      console.error('Ошибка изменения статуса товара:', error);
    }
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
    if (!isAuthenticated || !supabase) {
      throw new Error('Удаление доступно только для аутентифицированных пользователей');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не найден');

      // Сразу удаляем из локального состояния для немедленного обновления UI
      setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== id));
      
      // Отменяем редактирование если удаляется редактируемый элемент
      if (editingItemId === id) {
        setEditingItemId(null);
      }

      // Удаляем из Supabase
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        // При ошибке восстанавливаем элемент
        await loadWishlistFromSupabase(user.id);
        throw error;
      }
      
    } catch (error) {
      console.error('Ошибка при удалении элемента:', error);
      throw error;
    }
  };

  return {
    wishlist,
    editingItemId,
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
    handleCancelEdit: () => setEditingItemId(null),
    isLoading
  };
}; 