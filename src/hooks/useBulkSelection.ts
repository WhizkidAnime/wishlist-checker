import { useState } from 'react';
import { WishlistItem } from '../types/wishlistItem';

export const useBulkSelection = (wishlist: WishlistItem[]) => {
  const [bulkSelectedItemIds, setBulkSelectedItemIds] = useState<(string | number)[]>([]);

  const bulkSelectedCount = bulkSelectedItemIds.length;
  const bulkSelectedItems = wishlist.filter(item => bulkSelectedItemIds.includes(item.id));

  const handleToggleBulkSelected = (id: string | number) => {
    setBulkSelectedItemIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const clearBulkSelection = () => {
    setBulkSelectedItemIds([]);
  };

  const removeFromBulkSelection = (id: string | number) => {
    setBulkSelectedItemIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  return {
    bulkSelectedItemIds,
    setBulkSelectedItemIds,
    bulkSelectedCount,
    bulkSelectedItems,
    handleToggleBulkSelected,
    clearBulkSelection,
    removeFromBulkSelection
  };
}; 