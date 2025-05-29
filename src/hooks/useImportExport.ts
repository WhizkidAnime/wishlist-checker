import { useState, useEffect } from 'react';
import { WishlistItem } from '../types/wishlistItem';

// Тип для полного экспорта данных включая категории
interface WishlistExportData {
  wishlist: WishlistItem[];
  categories: string[];
  exportVersion: '2.0'; // версия формата для будущей совместимости
}

export const useImportExport = (
  wishlist: WishlistItem[],
  setWishlist: (items: WishlistItem[]) => void,
  triggerSync?: () => void, // Функция для запуска синхронизации
  isAuthenticated?: boolean // Статус аутентификации
) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [dataToImport, setDataToImport] = useState<WishlistExportData | WishlistItem[] | null>(null);
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
    // Проверяем аутентификацию
    if (!isAuthenticated) {
      alert("Для экспорта данных необходимо войти в аккаунт");
      return;
    }

    try {
      // Загружаем категории из localStorage
      const categoriesFromStorage = (() => {
        try {
          const saved = localStorage.getItem('wishlistCategories');
          return saved ? JSON.parse(saved) : [];
        } catch {
          return [];
        }
      })();

      // Собираем категории из товаров
      const categoriesFromItems = [...new Set(
        wishlist
          .map(item => item.category)
          .filter((category): category is string => !!category?.trim())
      )];

      // Объединяем все категории (сохранённые + из товаров)
      const allCategories = [...new Set([...categoriesFromStorage, ...categoriesFromItems])].sort();

      // Создаём полный объект для экспорта
      const exportData: WishlistExportData = {
        wishlist,
        categories: allCategories,
        exportVersion: '2.0'
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
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
    // Проверяем аутентификацию
    if (!isAuthenticated) {
      alert("Для импорта данных необходимо войти в аккаунт");
      event.target.value = ''; 
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("Не удалось прочитать файл как текст.");
        
        const parsedData = JSON.parse(text);

        // Проверяем, новый ли это формат с категориями
        if (parsedData && typeof parsedData === 'object' && 'exportVersion' in parsedData) {
          // Новый формат (версия 2.0+)
          const exportData = parsedData as WishlistExportData;
          
          if (!Array.isArray(exportData.wishlist)) {
            throw new Error("Импортированный файл должен содержать массив товаров в поле wishlist.");
          }

          if (!Array.isArray(exportData.categories)) {
            throw new Error("Импортированный файл должен содержать массив категорий в поле categories.");
          }

          // Валидация товаров
          const isValidWishlistStructure = exportData.wishlist.every(
            (item: any) => 
              typeof item === 'object' &&
              item !== null &&
              'id' in item && 
              'name' in item && 
              'price' in item && typeof item.price === 'number' &&
              'currency' in item && typeof item.currency === 'string' &&
              'isBought' in item && typeof item.isBought === 'boolean'
          );

          if (!isValidWishlistStructure) {
            throw new Error("Структура товаров в файле не соответствует формату вишлиста.");
          }

          // Валидация категорий
          const isValidCategoriesStructure = exportData.categories.every(
            (category: any) => typeof category === 'string'
          );

          if (!isValidCategoriesStructure) {
            throw new Error("Структура категорий в файле некорректна.");
          }
          
          setDataToImport(exportData);
        } else if (Array.isArray(parsedData)) {
          // Старый формат (только массив товаров) - для обратной совместимости
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

          if (!isValidStructure) {
            throw new Error("Структура данных в файле не соответствует формату вишлиста.");
          }
          
          setDataToImport(parsedData as WishlistItem[]);
        } else {
          throw new Error("Неизвестный формат файла. Ожидается массив товаров или объект с полным экспортом.");
        }
        
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
      if (Array.isArray(dataToImport)) {
        // Старый формат - только товары
        setWishlist(dataToImport);
        // Извлекаем категории из товаров и сохраняем их
        const categoriesFromItems = [...new Set(
          dataToImport
            .map(item => item.category)
            .filter((category): category is string => !!category?.trim())
        )].sort();
        
        try {
          localStorage.setItem('wishlistCategories', JSON.stringify(categoriesFromItems));
          // Уведомляем useCategories об обновлении
          window.dispatchEvent(new CustomEvent('categoriesUpdated'));
        } catch (error) {
          console.warn("Не удалось сохранить категории в localStorage:", error);
        }
      } else {
        // Новый формат - полный экспорт
        setWishlist(dataToImport.wishlist);
        // Сохраняем категории в localStorage
        try {
          localStorage.setItem('wishlistCategories', JSON.stringify(dataToImport.categories));
          // Уведомляем useCategories об обновлении
          window.dispatchEvent(new CustomEvent('categoriesUpdated'));
        } catch (error) {
          console.warn("Не удалось сохранить категории в localStorage:", error);
        }
      }
      setShowImportSuccessToast(true);
      
      // Запускаем синхронизацию после импорта
      if (triggerSync) {
        triggerSync();
      }
    }
    setDataToImport(null);
    setIsConfirmModalOpen(false);
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