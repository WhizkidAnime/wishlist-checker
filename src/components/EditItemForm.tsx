import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { WishlistItem } from '../types/wishlistItem';

interface EditItemFormProps {
  item: WishlistItem;
  onUpdateItem: (updatedItem: WishlistItem) => void;
  onCancel: () => void;
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
export const EditItemForm = ({ item, onUpdateItem, onCancel }: EditItemFormProps) => {
  // Используем один стейт для всех данных формы
  const [formData, setFormData] = useState({
    itemType: item.itemType || '',
    name: item.name || '',
    link: item.link || '',
    price: item.price.toString() || '',
    comment: item.comment || '',
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
    } else if (fieldName === 'price' && isNaN(parseFloat(value))) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Введите число' }));
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
  const validateSubmit = (): boolean => {
    const finalErrors: FormErrors = {};
    if (!formData.name.trim()) finalErrors.name = 'Название обязательно';
    if (!formData.price.trim()) finalErrors.price = 'Цена обязательна';
    else if (isNaN(parseFloat(formData.price))) finalErrors.price = 'Цена должна быть числом';
    else if (Number(formData.price) < 0) finalErrors.price = 'Цена не может быть отрицательной';
    if (formData.link && !isValidUrl(formData.link)) finalErrors.link = 'Некорректный URL';

    setErrors(finalErrors);
    return Object.keys(finalErrors).length === 0;
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateSubmit()) { // Используем новую функцию валидации
      return; 
    }
    
    const updatedItem: WishlistItem = {
      ...item,
      itemType: formData.itemType.trim(),
      name: formData.name.trim(),
      link: formData.link.trim(),
      price: Number(formData.price),
      comment: formData.comment.trim() || undefined,
    };
    
    onUpdateItem(updatedItem);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200 shadow-inner">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* Тип товара */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor={`edit-itemType-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Тип (опционально)
            </label>
            <input
              type="text"
              id={`edit-itemType-${item.id}`}
              name="itemType"
              value={formData.itemType}
              onChange={handleChange}
              className={`w-full px-3 py-1.5 border ${errors.itemType ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.itemType ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm`}
              autoComplete="off"
            />
            {errors.itemType && <p className="mt-1 text-xs text-red-600">{errors.itemType}</p>}
          </div>
          
          {/* Название */}
          <div className="flex-1 min-w-[200px]">
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
              className={`w-full px-3 py-1.5 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.name ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm`}
              autoComplete="off"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          
          {/* Цена */}
          <div className="min-w-[120px] w-[15%]">
            <label htmlFor={`edit-price-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Цена *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                id={`edit-price-${item.id}`}
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className={`w-full px-3 py-1.5 border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.price ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm pr-10`}
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">{item.currency}</span>
              </div>
            </div>
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
          </div>
          
          {/* Ссылка (опционально) */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor={`edit-link-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка (опционально)
            </label>
            <input
              type="url"
              id={`edit-link-${item.id}`}
              name="link"
              value={formData.link}
              onChange={handleChange}
              className={`w-full px-3 py-1.5 border ${errors.link ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.link ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} text-sm`}
              autoComplete="off"
            />
            {errors.link && <p className="mt-1 text-xs text-red-600">{errors.link}</p>}
          </div>

          {/* Комментарий (опционально) */}
          <div className="w-full">
            <label htmlFor={`edit-comment-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий (опционально)
            </label>
            <textarea
              id={`edit-comment-${item.id}`}
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y"
              autoComplete="off"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors duration-150 ease-in-out"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 border border-transparent rounded-full text-sm font-medium text-white bg-black hover:bg-black focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50"
            disabled={Object.keys(errors).length > 0 || !formData.name || !formData.price}
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
};