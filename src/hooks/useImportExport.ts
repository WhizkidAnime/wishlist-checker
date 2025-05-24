import { useState, useEffect } from 'react';
import { WishlistItem } from '../types/wishlistItem';

export const useImportExport = (
  wishlist: WishlistItem[],
  setWishlist: (items: WishlistItem[]) => void
) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [dataToImport, setDataToImport] = useState<WishlistItem[] | null>(null);
  const [showImportSuccessToast, setShowImportSuccessToast] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showImportSuccessToast) {
      timer = setTimeout(() => {
        setShowImportSuccessToast(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showImportSuccessToast]);

  const handleExport = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(wishlist, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "wishlist.json";
      link.click();
      link.remove();
    } catch (error) {
      console.error("Ошибка при экспорте wishlist:", error);
      alert("Не удалось экспортировать данные.");
    }
  };

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
        
        setDataToImport(parsedData as WishlistItem[]); 
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

  return {
    isConfirmModalOpen,
    showImportSuccessToast,
    handleExport,
    handleImport,
    handleModalConfirm,
    handleModalClose
  };
}; 