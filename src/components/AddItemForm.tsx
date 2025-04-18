import { useState, FormEvent } from 'react';
import { WishlistItem } from '../types/wishlistItem';

interface AddItemFormProps {
  onAddItem: (item: WishlistItem) => void;
}

interface FormErrors {
  itemType?: string;
  name?: string;
  price?: string;
}

/**
 * Компонент формы для добавления нового элемента в вишлист
 */
export const AddItemForm = ({ onAddItem }: AddItemFormProps) => {
  const [itemType, setItemType] = useState('');
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!itemType.trim()) newErrors.itemType = 'Тип товара обязателен';
    if (!name.trim()) newErrors.name = 'Название обязательно';
    if (!price.trim()) newErrors.price = 'Цена обязательна';
    else if (Number(price) < 0) newErrors.price = 'Цена не может быть отрицательной';
    
    setErrors(newErrors);
    // Возвращает true, если ошибок нет
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return; // Если есть ошибки, прерываем отправку
    }
    
    // Создание нового элемента вишлиста
    const newItem: WishlistItem = {
      id: Date.now().toString(), // Генерация уникального ID
      itemType: itemType.trim(),
      name: name.trim(),
      link: link.trim(),
      price: Number(price),
      currency: 'RUB', // По умолчанию рубли
      isBought: false // Новый элемент не куплен
    };
    
    // Вызов функции обратного вызова для добавления элемента
    onAddItem(newItem);
    
    // Сброс формы и ошибок
    setItemType('');
    setName('');
    setLink('');
    setPrice('');
    setErrors({});
  };

  const handleInputChange = <K extends keyof FormErrors>(field: K, value: string) => {
    // Обновляем состояние поля
    if (field === 'itemType') setItemType(value);
    else if (field === 'name') setName(value);
    else if (field === 'link') setLink(value);
    else if (field === 'price') setPrice(value);

    // Очищаем ошибку для этого поля при вводе
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  return (
    <div className="mb-6 sm:mb-8 p-4 bg-white rounded-lg border border-gray-200">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Добавить новое желание</h2>
      
      <form onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
          {/* Тип товара */}
          <div className="mb-3">
            <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-1">
              Тип товара *
            </label>
            <input
              type="text"
              id="itemType"
              value={itemType}
              onChange={(e) => handleInputChange('itemType', e.target.value)}
              className={`w-full px-3 py-3 sm:py-2 text-base border rounded-md focus:outline-none focus:border-transparent transition-all duration-200 ${errors.itemType ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
              required
              autoComplete="off"
            />
            {errors.itemType && <p className="mt-1 text-sm text-red-600">{errors.itemType}</p>}
          </div>
          
          {/* Название */}
          <div className="mb-3">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-3 sm:py-2 text-base border rounded-md focus:outline-none focus:border-transparent transition-all duration-200 ${errors.name ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
              required
              autoComplete="off"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          {/* Ссылка (опционально) */}
          <div className="mb-3">
            <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка (опционально)
            </label>
            <input
              type="url"
              id="link"
              value={link}
              onChange={(e) => handleInputChange('link', e.target.value)}
              className="w-full px-3 py-3 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              autoComplete="off"
            />
          </div>
          
          {/* Цена */}
          <div className="mb-3">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Цена *
            </label>
            <div className="relative">
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={`w-full px-3 py-3 sm:py-2 text-base border rounded-md focus:outline-none focus:border-transparent transition-all duration-200 ${errors.price ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
                min="0"
                step="1"
                required
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">RUB</span>
              </div>
            </div>
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>
        </div>
        
        <div className="flex justify-center mt-5">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-black text-white rounded-full font-semibold hover:bg-black focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!name || !price || Object.keys(errors).length > 0}
          >
            Добавить
          </button>
        </div>
      </form>
    </div>
  );
};