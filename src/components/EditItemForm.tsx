import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { safeCalculate } from '../utils/priceCalculator';

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
    <div className="p-4 bg-gray-50 border-b border-gray-200 shadow-inner">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid xs:grid-cols-2 gap-4">
          {/* Тип товара */}
          <div>
            <label htmlFor={`edit-itemType-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Тип (опционально)
            </label>
            <input
              type="text"
              id={`edit-itemType-${item.id}`}
              name="itemType"
              value={formData.itemType}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.itemType ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.itemType ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm`}
              autoComplete="off"
            />
            {errors.itemType && <p className="mt-1 text-xs text-red-600">{errors.itemType}</p>}
          </div>
          
          {/* Название */}
          <div>
            <label htmlFor={`edit-name-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              id={`edit-name-${item.id}`}
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.name ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm`}
              autoComplete="off"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Категория */}
          <div>
            <label htmlFor={`edit-category-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Категория (опционально)
            </label>
            <input
              type="text"
              id={`edit-category-${item.id}`}
              name="category"
              value={formData.category}
              onChange={handleChange}
              list={`edit-categories-${item.id}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Выберите или введите новую"
              autoComplete="off"
            />
            <datalist id={`edit-categories-${item.id}`}>
              {existingCategories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          
          {/* Ссылка (опционально) */}
          <div>
            <label htmlFor={`edit-link-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка (опционально)
            </label>
            <input
              type="url"
              id={`edit-link-${item.id}`}
              name="link"
              value={formData.link}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.link ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.link ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm`}
              autoComplete="off"
            />
            {errors.link && <p className="mt-1 text-xs text-red-600">{errors.link}</p>}
          </div>
          
          {/* Цена */}
          <div className="min-w-0">
            <label htmlFor={`edit-price-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Цена *
            </label>
            <div className="flex rounded-md overflow-hidden border focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200" 
                 style={{ borderColor: errors.price ? '#ef4444' : '#d1d5db' }}>
              <input
                type="text"
                inputMode="decimal"
                id={`edit-price-${item.id}`}
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="45500 или 45 500 или 45000+500"
                className={`w-full p-2 text-sm border-0 focus:outline-none flex-1`}
                autoComplete="off"
              />
              <div className="flex items-center justify-center bg-gray-50 border-l border-gray-200" style={{ width: '35px', flexShrink: 0 }}>
                <span className="text-gray-500 text-sm">RUB</span>
              </div>
            </div>
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
          </div>

          {/* Комментарий (опционально) */}
          <div className="col-span-2">
            <label htmlFor={`edit-comment-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий (опционально)
            </label>
            <textarea
              id={`edit-comment-${item.id}`}
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y"
              autoComplete="off"
            />
          </div>
        </div>
        
        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!!errors.name || !!errors.price || !!errors.link}
            className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
};