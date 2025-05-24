import { useState } from 'react';
import { WishlistItem } from '../types/wishlistItem';

export const useDeleteModal = (
  handleDeleteItem: (id: string | number) => void,
  removeFromSelection: (id: string | number) => void
) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);

  const handleDeleteClick = (item: WishlistItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      handleDeleteItem(itemToDelete.id);
      removeFromSelection(itemToDelete.id);
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return {
    isDeleteModalOpen,
    itemToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel
  };
}; 