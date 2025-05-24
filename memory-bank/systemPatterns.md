# Системные паттерны - Мой Вишлист

## Архитектурные паттерны

### Компонентная архитектура
```
App.tsx (State Container)
├── AddItemForm.tsx (Form Component)
├── WishlistContainer.tsx (List Container)
│   └── WishlistItem.tsx (Item Component)
│       └── EditItemForm.tsx (Inline Edit Form)
```

### Паттерн Container/Presenter
- **App.tsx**: Контейнер, управляет состоянием всего приложения
- **WishlistContainer.tsx**: Контейнер для списка, управляет сортировкой и фильтрацией
- **WishlistItem.tsx**: Презентационный компонент для отображения товара
- **AddItemForm.tsx**: Контролируемая форма для добавления товаров

### Управление состоянием (State Management)
```typescript
// Централизованное состояние в App.tsx
const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [sortBy, setSortBy] = useState<'custom' | 'price' | 'itemType'>('custom');
const [filterBy, setFilterBy] = useState<'all' | 'bought' | 'notBought'>('all');
```

## Паттерны управления данными

### Local Storage паттерн
```typescript
// Утилиты для работы с локальным хранилищем
export const saveToLocalStorage = (data: WishlistItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = (): WishlistItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return [];
  }
};
```

### CRUD паттерн
- **Create**: `handleAddItem` - добавление нового товара
- **Read**: `loadFromLocalStorage` - загрузка данных
- **Update**: `handleUpdateItem` - обновление товара
- **Delete**: `handleDeleteItem` - удаление товара

### Синхронизация данных
```typescript
// useEffect для синхронизации с localStorage
useEffect(() => {
  saveToLocalStorage(wishlist);
}, [wishlist]);
```

## Компонентные паттерны

### Контролируемые компоненты (Controlled Components)
```typescript
// Все формы используют контролируемые input'ы
const [formData, setFormData] = useState({
  itemType: '',
  name: '',
  link: '',
  price: 0,
  currency: 'RUB'
});
```

### Callback паттерн
```typescript
// Функции передаются от родителя к дочерним компонентам
interface WishlistItemProps {
  item: WishlistItem;
  onDelete: (id: string | number) => void;
  onUpdate: (id: string | number, updatedItem: Partial<WishlistItem>) => void;
  onToggleBought: (id: string | number) => void;
}
```

### Условный рендеринг
```typescript
// Паттерн для отображения разных состояний
{isEditing ? (
  <EditItemForm />
) : (
  <ItemDisplay />
)}
```

## Пользовательский интерфейс паттерны

### Mobile-first дизайн
```css
/* Базовые стили для мобильных устройств */
.container {
  @apply px-4 py-2;
}

/* Адаптация для больших экранов */
@media (min-width: 768px) {
  .container {
    @apply px-6 py-4;
  }
}
```

### Компонентная композиция
```typescript
// Переиспользуемые UI элементы
const Button = ({ variant, children, onClick }) => (
  <button 
    className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
    onClick={onClick}
  >
    {children}
  </button>
);
```

## Паттерны валидации

### Валидация форм
```typescript
const validatePrice = (input: string): number | null => {
  // Поддержка математических выражений
  const cleanInput = input.replace(/\s/g, '');
  if (/^[\d+\-*/().]+$/.test(cleanInput)) {
    try {
      return Function(`"use strict"; return (${cleanInput})`)();
    } catch {
      return null;
    }
  }
  return null;
};
```

### Безопасность данных
```typescript
// Валидация перед сохранением
const sanitizeItem = (item: Partial<WishlistItem>): WishlistItem => ({
  id: item.id || generateId(),
  itemType: item.itemType?.trim() || '',
  name: item.name?.trim() || '',
  link: item.link?.trim() || '',
  price: Math.max(0, item.price || 0),
  currency: item.currency || 'RUB',
  isBought: Boolean(item.isBought),
  comment: item.comment?.trim() || ''
});
```

## Производительность паттерны

### Оптимизация рендеринга
```typescript
// Мемоизация тяжелых вычислений
const filteredAndSortedItems = useMemo(() => {
  return filterAndSortItems(wishlist, searchTerm, filterBy, sortBy);
}, [wishlist, searchTerm, filterBy, sortBy]);
```

### Lazy loading
```typescript
// Отложенная загрузка компонентов (для будущего использования)
const LazyComponent = React.lazy(() => import('./HeavyComponent'));
```

## Обработка ошибок

### Error Boundary паттерн
```typescript
// Для будущего улучшения
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Graceful degradation
```typescript
// Обработка ошибок localStorage
try {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
} catch (error) {
  console.error('LocalStorage error:', error);
  // Возвращаем пустой массив вместо падения приложения
  return [];
}
```

## Accessibility паттерны

### Семантический HTML
```typescript
// Использование правильных семантических тегов
<main role="main">
  <section aria-label="Wishlist Items">
    <article role="article">
      <h2>{item.name}</h2>
    </article>
  </section>
</main>
```

### Keyboard navigation
```typescript
// Поддержка навигации с клавиатуры
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
```

## Интеграционные паттерны

### Drag & Drop интеграция
```typescript
// Использование @dnd-kit для перетаскивания
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
} = useSortable({id: item.id});
```

### Модульность
```typescript
// Четкое разделение логики по модулям
import { WishlistItem } from '../types/wishlistItem';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/localStorageUtils';
``` 