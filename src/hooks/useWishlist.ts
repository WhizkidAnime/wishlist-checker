import { useState, useEffect, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { WishlistItem } from '../types/wishlistItem';
import { supabase } from '../utils/supabaseClient';
import { syncBlockManager } from '../utils/syncBlockManager';

export const useWishlist = (
  triggerSync?: (force?: boolean) => Promise<{ success: boolean; message: string; }>, 
  isAuthenticated?: boolean
) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'type-asc' | 'price-asc' | 'price-desc'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // Загрузка данных из Supabase
  const loadWishlistFromSupabase = async (userId: string) => {
    if (!supabase) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

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
      // Проверяем глобальную блокировку синхронизации
      if (syncBlockManager.isBlocked()) {
        // Убираем частые логи - только в debug режиме
        if (process.env.NODE_ENV === 'development') {
          console.log('Пропускаем синхронизацию: глобальная блокировка активна');
        }
        return;
      }
      
      // Не перезагружаем данные, если сейчас что-то редактируется или перемещается
      if (editingItemId !== null || isMoving) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Пропускаем синхронизацию: элемент в режиме редактирования или перемещения');
        }
        return;
      }
      
      // Дополнительная задержка для предотвращения гонки условий
      setTimeout(() => {
        // Повторная проверка блокировок после задержки
        if (syncBlockManager.isBlocked() || editingItemId !== null || isMoving) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Пропускаем отложенную синхронизацию: блокировка активна');
          }
          return;
        }
        
        supabase?.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            loadWishlistFromSupabase(user.id);
          }
        });
      }, 200);
    };

    window.addEventListener('wishlistDataUpdated', handleDataUpdate);
    return () => window.removeEventListener('wishlistDataUpdated', handleDataUpdate);
  }, [isAuthenticated, editingItemId, isMoving]);

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

      // Новые товары добавляются в конец списка
      const maxSortOrder = wishlist.length;

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
        sort_order: maxSortOrder + 1
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

      setWishlist(prev => [...prev, convertedItem]);
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

  const handleMoveItem = async (id: string | number, direction: 'up' | 'down') => {
    const currentIndex = wishlist.findIndex(item => item.id === id);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(wishlist.length - 1, currentIndex + 1);
    
    if (currentIndex !== newIndex) {
      setIsMoving(true); // Блокируем синхронизацию
      
      // Блокируем синхронизацию с автоматическим снятием блокировки
      const unblock = syncBlockManager.block(10000);
      
      // Обновляем локальное состояние немедленно для отзывчивости UI
      const newWishlist = arrayMove(wishlist, currentIndex, newIndex);
      setWishlist(newWishlist);
      
      // Сохраняем новый порядок в Supabase атомарно через RPC
      if (isAuthenticated && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Подготавливаем данные для RPC функции
            const itemOrders = newWishlist.map((item, index) => ({
              id: item.id,
              sort_order: index
            }));

            // Вызываем RPC функцию для атомарного обновления
            const { error } = await supabase.rpc('update_items_order', {
              p_user_id: user.id,
              p_item_orders: itemOrders
            });

            if (error) {
              console.error('Ошибка при сохранении порядка товаров:', error);
              // В случае ошибки восстанавливаем исходный порядок
              setWishlist(wishlist);
            }
          }
        } catch (error) {
          console.error('Ошибка при сохранении порядка товаров:', error);
          // В случае ошибки восстанавливаем исходный порядок
          setWishlist(wishlist);
        } finally {
          // Добавляем задержку перед разблокировкой для предотвращения гонки условий
          setTimeout(() => {
            setIsMoving(false);
            unblock();
          }, 300);
        }
      } else {
        setIsMoving(false);
        unblock();
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setIsMoving(true); // Блокируем синхронизацию
      
      // Блокируем синхронизацию с автоматическим снятием блокировки
      const unblock = syncBlockManager.block(10000);
      
      const oldIndex = wishlist.findIndex((item) => item.id === active.id);
      const newIndex = wishlist.findIndex((item) => item.id === over.id);
      
      // Обновляем локальное состояние немедленно
      const newWishlist = arrayMove(wishlist, oldIndex, newIndex);
      setWishlist(newWishlist);
      
      // Сохраняем новый порядок в Supabase атомарно через RPC
      if (isAuthenticated && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Подготавливаем данные для RPC функции
            const itemOrders = newWishlist.map((item, index) => ({
              id: item.id,
              sort_order: index
            }));

            // Вызываем RPC функцию для атомарного обновления
            const { error } = await supabase.rpc('update_items_order', {
              p_user_id: user.id,
              p_item_orders: itemOrders
            });

            if (error) {
              console.error('Ошибка при сохранении порядка товаров:', error);
              // В случае ошибки восстанавливаем исходный порядок
              setWishlist(wishlist);
            }
          }
        } catch (error) {
          console.error('Ошибка при сохранении порядка товаров:', error);
          // В случае ошибки восстанавливаем исходный порядок
          setWishlist(wishlist);
        } finally {
          // Добавляем задержку перед разблокировкой для предотвращения гонки условий
          setTimeout(() => {
            setIsMoving(false);
            unblock();
          }, 300);
        }
      } else {
        setIsMoving(false);
        unblock();
      }
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