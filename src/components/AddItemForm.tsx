import { useState, FormEvent } from 'react';
import { WishlistItem } from '../types/wishlistItem';

interface AddItemFormProps {
  onAddItem: (item: Omit<WishlistItem, 'id' | 'isBought'>) => void;
}

interface FormErrors {
  itemType?: string;
  name?: string;
  price?: string;
}

// Функция для безопасного вычисления математического выражения
// Разрешает только числа, точки, +, -, *, /
function safeCalculate(expression: string): number | null {
  // Удаляем все пробелы
  const sanitizedExpression = expression.replace(/\s+/g, '');
  
  // Проверяем на допустимые символы (цифры, точка, +, -, *, /)
  if (!/^[-+\*\/\.\d]+$/.test(sanitizedExpression)) {
    return null; // Недопустимые символы
  }
  
  // Простая проверка на опасные конструкции (хотя regex выше должен отсечь)
  if (sanitizedExpression.includes('--') || sanitizedExpression.includes('++') || sanitizedExpression.includes('**') || sanitizedExpression.includes('//')) {
      return null;
  }
  
  try {
    // Используем new Function для безопасного вычисления
    // 'use strict' добавляет дополнительный слой безопасности
    const calculate = new Function(`'use strict'; return (${sanitizedExpression});`);
    const result = calculate();
    
    // Проверяем, что результат - конечное число
    if (typeof result === 'number' && isFinite(result)) {
      return result;
    } else {
      return null; // Результат не число или бесконечность
    }
  } catch (error) {
    console.error("Ошибка вычисления выражения:", error);
    return null; // Ошибка во время вычисления
  }
}

/**
 * Компонент формы для добавления нового элемента в вишлист
 */
export const AddItemForm = ({ onAddItem }: AddItemFormProps) => {
  const [itemType, setItemType] = useState('');
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): { isValid: boolean; calculatedPrice: number | null } => {
    const newErrors: FormErrors = {};
    let calculatedPrice: number | null = null;

    if (!itemType.trim()) newErrors.itemType = 'Тип товара обязателен';
    if (!name.trim()) newErrors.name = 'Название обязательно';
    if (!price.trim()) {
      newErrors.price = 'Цена обязательна';
    } else {
      calculatedPrice = safeCalculate(price);
      if (calculatedPrice === null) {
        newErrors.price = 'Некорректное выражение или недопустимые символы';
      } else if (calculatedPrice < 0) {
        newErrors.price = 'Цена не может быть отрицательной';
      }
    }
    
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, calculatedPrice };
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const { isValid, calculatedPrice } = validateForm();
    
    if (!isValid || calculatedPrice === null) {
      return; // Если есть ошибки или цена не вычислилась, прерываем отправку
    }
    
    const newItem: Omit<WishlistItem, 'id' | 'isBought'> = {
      itemType: itemType.trim(),
      name: name.trim(),
      link: link.trim(),
      price: calculatedPrice, // Используем вычисленную цену
      currency: 'RUB', // По умолчанию рубли
      comment: comment.trim() || undefined,
    };
    
    onAddItem(newItem);
    
    // Сброс формы и ошибок
    setItemType('');
    setName('');
    setLink('');
    setPrice('');
    setErrors({});
    setComment('');
  };

  const handleInputChange = <K extends keyof FormErrors | 'comment'>(field: K, value: string) => {
    // Обновляем состояние поля
    if (field === 'itemType') setItemType(value);
    else if (field === 'name') setName(value);
    else if (field === 'link') setLink(value);
    else if (field === 'price') setPrice(value);
    else if (field === 'comment') setComment(value);

    // Очищаем ошибку для этого поля при вводе
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };
  
  return (
    <div className="mb-6 sm:mb-8 p-4 bg-white rounded-lg border border-gray-200">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Добавить новое желание</h2>
      
      <form onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 mb-4">
          {/* Тип товара */}
          <div className="md:col-span-1">
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
          <div className="md:col-span-1">
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
          <div className="md:col-span-1">
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
          <div className="md:col-span-1">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Цена *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                id="price"
                value={price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={`w-full pl-3 pr-10 py-3 sm:py-2 text-base border rounded-md focus:outline-none focus:border-transparent transition-all duration-200 ${errors.price ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
                placeholder="Напр., 5000 или 4500+500"
                required
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">RUB</span>
              </div>
            </div>
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          {/* Комментарий (опционально) */}
          <div className="col-span-full">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий (опционально)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-y"
              autoComplete="off"
            />
          </div>
        </div>
        
        <div className="flex justify-center mt-5">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-black text-white rounded-full font-semibold hover:bg-black focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!errors.itemType || !!errors.name || !!errors.price || !price.trim()}
          >
            Добавить
          </button>
        </div>
      </form>
    </div>
  );
};