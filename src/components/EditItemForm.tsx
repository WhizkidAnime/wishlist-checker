import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { safeCalculate } from '../utils/priceCalculator';
import { Tooltip } from './ui/Tooltip';

interface EditItemFormProps {
  item: WishlistItem;
  onUpdateItem: (updatedItem: WishlistItem) => void;
  onCancel: () => void;
  existingCategories?: string[];
}

interface FormErrors {
  itemType?: string;
  name?: string;
  price?: string;
  link?: string;
}

/**
 * Компонент формы для редактирования существующего элемента в вишлисте
 */
export const EditItemForm = ({ item, onUpdateItem, onCancel, existingCategories = [] }: EditItemFormProps) => {
  // Используем один стейт для всех данных формы
  const [formData, setFormData] = useState({
    itemType: item.itemType || '',
    name: item.name || '',
    link: item.link || '',
    price: item.price.toString() || '',
    comment: item.comment || '',
    category: item.category || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Обновляем состояние формы при изменении редактируемого элемента
  useEffect(() => {
    setFormData({
        itemType: item.itemType || '',
        name: item.name || '',
        link: item.link || '',
        price: item.price.toString() || '',
        comment: item.comment || '',
        category: item.category || '',
    });
    setErrors({}); 
  }, [item]);

  // Обработчик изменения поля ввода
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name: fieldName, value } = e.target;
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    // Валидация при изменении (можно добавить более сложную)
    if ((fieldName === 'name' || fieldName === 'price') && value.trim() === '') {
      setErrors(prev => ({ ...prev, [fieldName]: 'Это поле обязательно' }));
    } else if (fieldName === 'price') {
      // Используем safeCalculate для проверки валидности выражения
      const calculatedPrice = safeCalculate(value);
      if (calculatedPrice === null) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Некорректное выражение или недопустимые символы' }));
      } else if (calculatedPrice < 0) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Цена не может быть отрицательной' }));
      } else {
        // Убираем ошибку для цены, если она валидна
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName as keyof FormErrors];
          return newErrors;
        });
      }
    } else if (fieldName === 'link' && value && !isValidUrl(value)) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Некорректный URL' }));
    } else {
      // Убираем ошибку, если поле стало валидным
      setErrors(prev => {
        const newErrors = { ...prev };
        // Используем 'as keyof FormErrors' для безопасности типов
        delete newErrors[fieldName as keyof FormErrors]; 
        return newErrors;
      });
    }
  };
  
  // Простая функция валидации URL
  const isValidUrl = (urlString: string): boolean => {
    try { new URL(urlString); return true; } catch (_) { return false; } 
  };

  // Финальная валидация перед отправкой
  const validateSubmit = (): { isValid: boolean; calculatedPrice: number | null } => {
    const finalErrors: FormErrors = {};
    let calculatedPrice: number | null = null;
    
    if (!formData.name.trim()) finalErrors.name = 'Название обязательно';
    if (!formData.price.trim()) {
      finalErrors.price = 'Цена обязательна';
    } else {
      calculatedPrice = safeCalculate(formData.price);
      if (calculatedPrice === null) {
        finalErrors.price = 'Некорректное выражение или недопустимые символы';
      } else if (calculatedPrice < 0) {
        finalErrors.price = 'Цена не может быть отрицательной';
      }
    }
    if (formData.link && !isValidUrl(formData.link)) finalErrors.link = 'Некорректный URL';

    setErrors(finalErrors);
    return { isValid: Object.keys(finalErrors).length === 0, calculatedPrice };
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const { isValid, calculatedPrice } = validateSubmit();
    
    if (!isValid || calculatedPrice === null) {
      return; 
    }
    
    const updatedItem: WishlistItem = {
      ...item,
      itemType: formData.itemType.trim(),
      name: formData.name.trim(),
      link: formData.link.trim(),
      price: calculatedPrice, // Используем вычисленную цену
      comment: formData.comment.trim() || undefined,
      category: formData.category.trim() || undefined,
    };
    
    onUpdateItem(updatedItem);
  };

  return (
    <div className="p-4 bg-theme-edit border-b border-gray-200 dark:border-gray-600 shadow-inner">
      <form onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Тип товара */}
          <div>
            <label htmlFor={`edit-itemType-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Тип (опционально)
            </label>
            <input
              type="text"
              id={`edit-itemType-${item.id}`}
              name="itemType"
              value={formData.itemType}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.itemType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.itemType ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm input-theme`}
              autoComplete="off"
            />
            {errors.itemType && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.itemType}</p>}
          </div>
          
          {/* Название */}
          <div>
            <label htmlFor={`edit-name-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название *
            </label>
            <input
              type="text"
              id={`edit-name-${item.id}`}
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.name ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm input-theme`}
              autoComplete="off"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
          </div>

          {/* Цена */}
          <div className="min-w-0">
            <label htmlFor={`edit-price-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Цена *
            </label>
            <div className={`flex rounded-md overflow-hidden border focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-transparent transition-colors duration-200 ${errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
              <input
                type="text"
                inputMode="text"
                id={`edit-price-${item.id}`}
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="45500 или 45000+500"
                className="w-full p-2 text-sm border-0 focus:outline-none flex-1 placeholder:text-xs input-theme"
                autoComplete="off"
              />
              <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-600 border-l border-gray-200 dark:border-gray-600 transition-colors duration-200" style={{ width: '35px', flexShrink: 0 }}>
                <span className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-200">RUB</span>
              </div>
            </div>
            {errors.price && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.price}</p>}
          </div>

          {/* Категория */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <label htmlFor={`edit-category-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Категория (опционально)
            </label>
            <div className="relative">
              <input
                type="text"
                id={`edit-category-${item.id}`}
                name="category"
                value={formData.category}
                onChange={handleChange}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                className="w-full px-3 py-2 pr-16 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-xs input-theme"
                placeholder="Выберите или создайте"
                autoComplete="off"
              />
              
              {/* Кнопка очистки */}
              {formData.category && (
                <Tooltip content="Очистить категорию">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, category: '' }));
                      setShowCategoryDropdown(false);
                    }}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Tooltip>
              )}
              
              {/* Кнопка выпадающего списка */}
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {existingCategories.length > 0 ? (
                    <>
                      {existingCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, category: cat }));
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-black dark:text-theme-secondary hover:bg-gray-50 dark:hover:bg-gray-600 focus:bg-gray-50 dark:focus:bg-gray-600 focus:outline-none"
                        >
                          {cat}
                        </button>
                      ))}
                      {formData.category.trim() && !existingCategories.includes(formData.category.trim()) && (
                        <div className="border-t border-gray-100 dark:border-gray-600">
                          <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(false)}
                            className="w-full px-3 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:outline-none"
                          >
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Создать "{formData.category.trim()}"
                            </span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      {formData.category.trim() ? `Создать "${formData.category.trim()}"` : 'Введите название категории'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Ссылка (опционально) */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor={`edit-link-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ссылка (опционально)
            </label>
            <input
              type="url"
              id={`edit-link-${item.id}`}
              name="link"
              value={formData.link}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.link ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.link ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm input-theme`}
              autoComplete="off"
            />
            {errors.link && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.link}</p>}
          </div>

          {/* Комментарий (опционально) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor={`edit-comment-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Комментарий (опционально)
            </label>
            <textarea
              id={`edit-comment-${item.id}`}
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm input-theme resize-y"
              autoComplete="off"
            />
          </div>
        </div>
        
        <div className="flex justify-between gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-500 transition-colors duration-150"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!!errors.name || !!errors.price || !!errors.link}
            className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray-800 border border-transparent rounded-md shadow-sm hover:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
};