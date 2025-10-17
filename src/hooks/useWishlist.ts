import { useEffect, useMemo, useReducer } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { WishlistItem } from '../types/wishlistItem';
import { supabase } from '../utils/supabaseClient';
import { syncBlockManager } from '../utils/syncBlockManager';

// Состояние и редьюсер для управления логикой вишлиста
type SortMode = 'default' | 'type-asc' | 'price-asc' | 'price-desc';

interface WishlistState {
  wishlist: WishlistItem[];
  editingItemId: string | number | null;
  searchQuery: string;
  sortBy: SortMode;
  isLoading: boolean;
  isMoving: boolean;
  hasInitialLoadCompleted: boolean;
}

type WishlistAction =
  | { type: 'SET_WISHLIST'; payload: WishlistItem[] }
  | { type: 'APPEND_ITEM'; payload: WishlistItem }
  | { type: 'UPDATE_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string | number } }
  | { type: 'REORDER'; payload: WishlistItem[] }
  | { type: 'SET_EDITING'; payload: { id: string | number | null } }
  | { type: 'CLEAR_EDITING' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SORT_BY'; payload: SortMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MOVING'; payload: boolean }
  | { type: 'SET_INITIAL_LOAD_COMPLETED'; payload: boolean }
  | { type: 'RESET_ON_SIGN_OUT' };

const initialState: WishlistState = {
  wishlist: [],
  editingItemId: null,
  searchQuery: '',
  sortBy: 'default',
  isLoading: false,
  isMoving: false,
  hasInitialLoadCompleted: false,
};

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'SET_WISHLIST':
      return { ...state, wishlist: action.payload };
    case 'APPEND_ITEM':
      return { ...state, wishlist: [...state.wishlist, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        wishlist: state.wishlist.map(item => (item.id === action.payload.id ? action.payload : item)),
      };
    case 'REMOVE_ITEM':
      return { ...state, wishlist: state.wishlist.filter(item => item.id !== action.payload.id) };
    case 'REORDER':
      return { ...state, wishlist: action.payload };
    case 'SET_EDITING':
      return { ...state, editingItemId: action.payload.id };
    case 'CLEAR_EDITING':
      return { ...state, editingItemId: null };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_MOVING':
      return { ...state, isMoving: action.payload };
    case 'SET_INITIAL_LOAD_COMPLETED':
      return { ...state, hasInitialLoadCompleted: action.payload };
    case 'RESET_ON_SIGN_OUT':
      return { ...initialState, hasInitialLoadCompleted: true };
    default:
      return state;
  }
}

export const useWishlist = (
  triggerSync?: (force?: boolean) => Promise<{ success: boolean; message: string; }>, 
  isAuthenticated?: boolean
) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  const generateLocalId = () => {
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        // @ts-ignore
        return crypto.randomUUID();
      }
    } catch {}
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  // Загрузка данных из Supabase
  const loadWishlistFromSupabase = async (userId: string) => {
    if (!supabase) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const convertedItems: WishlistItem[] = (data || []).map(item => ({
        id: item.id,
        itemType: item.item_type || undefined,
        name: item.name,
        link: item.link || '',
        price: Number(item.price),
        currency: item.currency,
        isBought: item.is_bought,
        comment: item.comment || '',
        category: item.category || undefined
      }));

      dispatch({ type: 'SET_WISHLIST', payload: convertedItems });
    } catch (error) {
      console.error('Ошибка загрузки данных из Supabase:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIAL_LOAD_COMPLETED', payload: true });
    }
  };

  // Эффект для загрузки данных при аутентификации
  useEffect(() => {
    if (isAuthenticated === false) {
      dispatch({ type: 'RESET_ON_SIGN_OUT' });
    } else if (isAuthenticated === true && triggerSync) {
      dispatch({ type: 'SET_INITIAL_LOAD_COMPLETED', payload: false });
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
      if (state.editingItemId !== null || state.isMoving) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Пропускаем синхронизацию: элемент в режиме редактирования или перемещения');
        }
        return;
      }
      
      // Дополнительная задержка для предотвращения гонки условий
      setTimeout(() => {
        // Повторная проверка блокировок после задержки
        if (syncBlockManager.isBlocked() || state.editingItemId !== null || state.isMoving) {
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
  }, [isAuthenticated, state.editingItemId, state.isMoving]);

  // Базовая функция фильтрации и сортировки (без категорий)
  const getFilteredAndSortedItems = (items: WishlistItem[]) => {
    const query = state.searchQuery.toLowerCase().trim();
    
    let filtered = query 
      ? items.filter(item => 
          item.name.toLowerCase().includes(query) || 
          (item.itemType && item.itemType.toLowerCase().includes(query))
        )
      : [...items];

    switch (state.sortBy) {
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
    return getFilteredAndSortedItems(state.wishlist);
  }, [state.wishlist, state.searchQuery, state.sortBy]);

  const totalUnbought = useMemo(() => {
    return state.wishlist
      .filter(item => !item.isBought)
      .reduce((sum, item) => sum + item.price, 0);
  }, [state.wishlist]);

  const totalBought = useMemo(() => {
    return state.wishlist
      .filter(item => item.isBought)
      .reduce((sum, item) => sum + item.price, 0);
  }, [state.wishlist]);

  const handleAddItem = async (newItem: Omit<WishlistItem, 'id' | 'isBought'>) => {
    // Локальный режим: работаем только со state
    if (!isAuthenticated || !supabase) {
      const convertedItem: WishlistItem = {
        id: generateLocalId(),
        itemType: newItem.itemType,
        name: newItem.name,
        link: newItem.link || '',
        price: Number(newItem.price),
        currency: newItem.currency,
        isBought: false,
        comment: newItem.comment || '',
        category: newItem.category || undefined
      };
      dispatch({ type: 'APPEND_ITEM', payload: convertedItem });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Новые товары добавляются в конец списка
      const maxSortOrder = state.wishlist.length;

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
        itemType: data.item_type || undefined,
        name: data.name,
        link: data.link || '',
        price: Number(data.price),
        currency: data.currency,
        isBought: data.is_bought,
        comment: data.comment || '',
        category: data.category || undefined
      };

      dispatch({ type: 'APPEND_ITEM', payload: convertedItem });
    } catch (error) {
      console.error('Ошибка добавления товара:', error);
    }
  };

  const handleUpdateItem = async (updatedItem: WishlistItem) => {
    if (!isAuthenticated || !supabase) {
      dispatch({ type: 'UPDATE_ITEM', payload: updatedItem });
      dispatch({ type: 'CLEAR_EDITING' });
      return;
    }

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
      dispatch({ type: 'UPDATE_ITEM', payload: updatedItem });
      dispatch({ type: 'CLEAR_EDITING' });
    } catch (error) {
      console.error('Ошибка обновления товара:', error);
    }
  };

  const handleToggleBought = async (id: string | number) => {
    if (!isAuthenticated || !supabase) {
      const item = state.wishlist.find(item => item.id === id);
      if (!item) return;
      const newIsBought = !item.isBought;
      dispatch({
        type: 'SET_WISHLIST',
        payload: state.wishlist.map(it => (it.id === id ? { ...it, isBought: newIsBought } : it)),
      });
      return;
    }

    try {
      const item = state.wishlist.find(item => item.id === id);
      if (!item) return;

      const newIsBought = !item.isBought;

      const { error } = await supabase
        .from('wishlist_items')
        .update({ is_bought: newIsBought })
        .eq('id', id);

      if (error) throw error;

      // Обновляем локальное состояние
      dispatch({
        type: 'SET_WISHLIST',
        payload: state.wishlist.map(item => (item.id === id ? { ...item, isBought: newIsBought } : item)),
      });
    } catch (error) {
      console.error('Ошибка изменения статуса товара:', error);
    }
  };

  const handleMoveItem = async (id: string | number, direction: 'up' | 'down') => {
    const currentIndex = state.wishlist.findIndex(item => item.id === id);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(state.wishlist.length - 1, currentIndex + 1);
    
    if (currentIndex !== newIndex) {
      dispatch({ type: 'SET_MOVING', payload: true }); // Блокируем синхронизацию
      
      // Блокируем синхронизацию с автоматическим снятием блокировки
      const unblock = syncBlockManager.block(10000);
      
      // Делаем снимок текущего состояния, чтобы безопасно откатиться при ошибке
      const prevWishlist = state.wishlist;
      // Обновляем локальное состояние немедленно для отзывчивости UI
      const newWishlist = arrayMove(prevWishlist, currentIndex, newIndex);
      dispatch({ type: 'REORDER', payload: newWishlist });
      
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
              dispatch({ type: 'SET_WISHLIST', payload: prevWishlist });
            }
          }
        } catch (error) {
          console.error('Ошибка при сохранении порядка товаров:', error);
          // В случае ошибки восстанавливаем исходный порядок
          dispatch({ type: 'SET_WISHLIST', payload: prevWishlist });
        } finally {
          // Увеличенная задержка снимает риск мгновенной синхронизации поверх локального порядка
          setTimeout(() => {
            dispatch({ type: 'SET_MOVING', payload: false });
            unblock();
          }, 600);
        }
      } else {
        dispatch({ type: 'SET_MOVING', payload: false });
        unblock();
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      dispatch({ type: 'SET_MOVING', payload: true }); // Блокируем синхронизацию
      
      // Блокируем синхронизацию с автоматическим снятием блокировки
      const unblock = syncBlockManager.block(10000);
      
      const prevWishlist = state.wishlist;
      const oldIndex = prevWishlist.findIndex((item) => item.id === active.id);
      const newIndex = prevWishlist.findIndex((item) => item.id === over.id);

      // Ограничиваем перестановку в пределах одной категории
      const oldItem = prevWishlist[oldIndex];
      const overItem = prevWishlist[newIndex];
      if (oldItem && overItem && (oldItem.category || null) !== (overItem.category || null)) {
        dispatch({ type: 'SET_MOVING', payload: false });
        unblock();
        return;
      }
      
      // Обновляем локальное состояние немедленно
      const newWishlist = arrayMove(prevWishlist, oldIndex, newIndex);
      dispatch({ type: 'REORDER', payload: newWishlist });
      
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
              dispatch({ type: 'SET_WISHLIST', payload: prevWishlist });
            }
          }
        } catch (error) {
          console.error('Ошибка при сохранении порядка товаров:', error);
          // В случае ошибки восстанавливаем исходный порядок
          dispatch({ type: 'SET_WISHLIST', payload: prevWishlist });
        } finally {
          // Увеличенная задержка снимает риск синхронизации, которая может вернуть старый порядок на мгновение
          setTimeout(() => {
            dispatch({ type: 'SET_MOVING', payload: false });
            unblock();
          }, 600);
        }
      } else {
        dispatch({ type: 'SET_MOVING', payload: false });
        unblock();
      }
    }
  };

  const handleDeleteItem = async (id: string | number): Promise<void> => {
    if (!isAuthenticated || !supabase) {
      // Локальный режим — просто удаляем из state
      dispatch({ type: 'REMOVE_ITEM', payload: { id } });
      if (state.editingItemId === id) {
        dispatch({ type: 'CLEAR_EDITING' });
      }
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не найден');

      // Сразу удаляем из локального состояния для немедленного обновления UI
      dispatch({ type: 'REMOVE_ITEM', payload: { id } });
      
      // Отменяем редактирование если удаляется редактируемый элемент
      if (state.editingItemId === id) {
        dispatch({ type: 'CLEAR_EDITING' });
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
    wishlist: state.wishlist,
    editingItemId: state.editingItemId,
    searchQuery: state.searchQuery,
    setSearchQuery: (q: string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: q }),
    sortBy: state.sortBy,
    setSortBy: (s: SortMode) => dispatch({ type: 'SET_SORT_BY', payload: s }),
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
    handleEditClick: (id: string | number | null) => dispatch({ type: 'SET_EDITING', payload: { id } }),
    handleCancelEdit: () => dispatch({ type: 'CLEAR_EDITING' }),
    isLoading: state.isLoading,
    hasInitialLoadCompleted: state.hasInitialLoadCompleted,
  };
}; 