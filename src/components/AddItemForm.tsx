import { useState, FormEvent, useRef, useEffect } from 'react';
import { WishlistItem } from '../types/wishlistItem';
import { safeCalculate } from '../utils/priceCalculator';
import { DesktopOnlyTooltip } from './ui/DesktopOnlyTooltip';
import { isValidHttpUrl } from '../utils/url';

interface AddItemFormProps {
  onAddItem: (item: Omit<WishlistItem, 'id' | 'isBought'>) => void;
  existingCategories?: string[];
  disabled?: boolean;
}

interface FormErrors {
  itemType?: string;
  name?: string;
  price?: string;
  link?: string;
}

/**
 * Компонент формы для добавления нового элемента в вишлист
 */
export const AddItemForm = ({ onAddItem, existingCategories = [], disabled = false }: AddItemFormProps) => {
  const [itemType, setItemType] = useState('');
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Ref для контейнера выпадающего списка категорий
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Обработчик клика вне области выпадающего списка
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  const validateForm = (): { isValid: boolean; calculatedPrice: number | null } => {
    const newErrors: FormErrors = {};
    let calculatedPrice: number | null = null;

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
    
    // Простаая проверка URL при наличии значения
    if (link.trim() && !isValidHttpUrl(link.trim())) newErrors.link = 'Некорректный URL';

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, calculatedPrice };
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;
    
    const { isValid, calculatedPrice } = validateForm();
    
    if (!isValid || calculatedPrice === null) {
      return; // Если есть ошибки или цена не вычислилась, прерываем отправку
    }
    
    const newItem: Omit<WishlistItem, 'id' | 'isBought'> = {
      itemType: itemType.trim() || undefined,
      name: name.trim(),
      link: link.trim(),
      price: calculatedPrice, // Используем вычисленную цену
      currency: 'RUB', // По умолчанию рубли
      comment: comment.trim() || undefined,
      category: category.trim() || undefined,
    };
    
    onAddItem(newItem);
    
    // Сброс формы и ошибок
    setItemType('');
    setName('');
    setLink('');
    setPrice('');
    setComment('');
    setCategory('');
    setErrors({});
  };

  const handleInputChange = <K extends keyof FormErrors | 'link' | 'comment' | 'category'>(field: K, value: string) => {
    if (disabled) return;
    
    // Обновляем состояние поля
    if (field === 'itemType') setItemType(value);
    else if (field === 'name') setName(value);
    else if (field === 'link') setLink(value);
    else if (field === 'price') setPrice(value);
    else if (field === 'comment') setComment(value);
    else if (field === 'category') setCategory(value);

    // Очищаем ошибку для этого поля при вводе
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  return (
    <div className={`mb-6 p-4 bg-theme-card rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <h2 className="text-xl font-semibold mb-4 text-black dark:text-theme-secondary">
        {disabled ? 'Войдите в аккаунт для добавления желаний' : 'Добавить новое желание'}
      </h2>
      
      <form onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Тип товара */}
          <div>
            <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Тип товара (опционально)
            </label>
            <input
              type="text"
              id="itemType"
              value={itemType}
              onChange={(e) => handleInputChange('itemType', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:border-transparent transition-all duration-200 input-theme ${errors.itemType ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'}`}
              autoComplete="off"
              maxLength={200}
            />
            {errors.itemType && <p className="mt-1 text-xs text-red-600">{errors.itemType}</p>}
          </div>
          
          {/* Название */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:border-transparent transition-all duration-200 input-theme ${errors.name ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'}`}
              required
              autoComplete="off"
              maxLength={300}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Цена */}
          <div className="min-w-0">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Цена *
            </label>
            <div className={`flex rounded-md overflow-hidden border focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors duration-200 ${errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
              <input
                type="text"
                inputMode="text"
                id="price"
                value={price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full p-2 text-sm border-0 focus:outline-none flex-1 placeholder:text-xs input-theme transition-colors duration-200"
                placeholder="45500 или 45000+500"
                required
                autoComplete="off"
                maxLength={32}
              />
              <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-700 border-l border-gray-200 dark:border-gray-600 transition-colors duration-200" style={{ width: '35px', flexShrink: 0 }}>
                <span className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-200">RUB</span>
              </div>
            </div>
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
          </div>

          {/* Категория */}
          <div className="relative sm:col-span-2 lg:col-span-1" ref={categoryDropdownRef}>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Категория (опционально)
            </label>
            <div className="relative">
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                onFocus={() => setShowCategoryDropdown(true)}
                className="w-full px-3 py-2 pr-16 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-xs input-theme"
                placeholder="Выберите или создайте"
                autoComplete="off"
                maxLength={200}
              />
              {/* Контейнер для иконок */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                {category && (
                  <DesktopOnlyTooltip content="Очистить">
                    <button
                      type="button"
                      onClick={() => {
                        setCategory('');
                        setShowCategoryDropdown(false);
                      }}
                      className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </DesktopOnlyTooltip>
                )}
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {showCategoryDropdown && (
                <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto" style={{ backgroundColor: 'var(--color-dropdown-background)' }}>
                  {existingCategories.length > 0 ? (
                    <>
                      {existingCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none text-black dark:text-theme-secondary"
                        >
                          {cat}
                        </button>
                      ))}
                      {category.trim() && !existingCategories.includes(category.trim()) && (
                        <div className="border-t border-gray-100 dark:border-gray-600">
                          <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(false)}
                            className="w-full px-3 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 focus:bg-blue-50 dark:focus:bg-blue-900 focus:outline-none"
                          >
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Создать "{category.trim()}"
                            </span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      {category.trim() ? `Создать "${category.trim()}"` : 'Введите название категории'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Ссылка (опционально) */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ссылка (опционально)
            </label>
            <input
              type="url"
              id="link"
              value={link}
              onChange={(e) => handleInputChange('link', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 input-theme"
              autoComplete="off"
              maxLength={2000}
            />
            {errors.link && <p className="mt-1 text-xs text-red-600">{errors.link}</p>}
          </div>

          {/* Комментарий (опционально) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Комментарий (опционально)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-y input-theme"
              autoComplete="off"
              maxLength={4000}
            />
          </div>
        </div>
        
        <div className="flex justify-center mt-4">
          <button
            type="submit"
            className="w-auto px-6 py-2 bg-theme-button text-theme-button rounded-full font-semibold hover:bg-theme-button focus:outline-none transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!errors.name || !!errors.price || !price.trim()}
          >
            Добавить
          </button>
        </div>
      </form>
    </div>
  );
};