import { useState, useMemo } from 'react';
import { WishlistItem } from '../types/wishlistItem';

export const useSelection = (wishlist: WishlistItem[]) => {
  const [selectedItemIds, setSelectedItemIds] = useState<(string | number)[]>([]);

  const selectedTotal = useMemo(() => {
    return wishlist
      .filter(item => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  }, [wishlist, selectedItemIds]);

  const selectedCount = selectedItemIds.length;
  const selectedItems = wishlist.filter(item => selectedItemIds.includes(item.id));

  const handleToggleSelected = (id: string | number) => {
    setSelectedItemIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedItemIds([]);
  };

  const removeFromSelection = (id: string | number) => {
    setSelectedItemIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  return {
    selectedItemIds,
    setSelectedItemIds,
    selectedTotal,
    selectedCount,
    selectedItems,
    handleToggleSelected,
    clearSelection,
    removeFromSelection
  };
}; 