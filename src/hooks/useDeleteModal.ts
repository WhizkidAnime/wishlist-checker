import { useState } from 'react';
import { WishlistItem } from '../types/wishlistItem';

export const useDeleteModal = (
  handleDeleteItem: (id: string | number) => Promise<void> | void,
  removeFromSelection: (id: string | number) => void
) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (item: WishlistItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete && !isDeleting) {
      setIsDeleting(true);
      try {
        await handleDeleteItem(itemToDelete.id);
        removeFromSelection(itemToDelete.id);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } catch (error) {
        console.error('Ошибка удаления элемента:', error);
        // Модальное окно остается открытым при ошибке
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  return {
    isDeleteModalOpen,
    itemToDelete,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel
  };
}; 