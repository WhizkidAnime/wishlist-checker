# Технический Контекст: Мой Вишлист

## Стек технологий

### Frontend
- **React 19.0.0** - основная библиотека UI
- **TypeScript** - типизированный JavaScript
- **Vite 6.2.0** - сборщик и dev server
- **Tailwind CSS 3.4.17** - utility-first CSS фреймворк

### Библиотеки UI и взаимодействия
- **@dnd-kit** - drag & drop функциональность
  - `@dnd-kit/core` - основные возможности
  - `@dnd-kit/sortable` - сортируемые списки
  - `@dnd-kit/utilities` - утилиты
- **Framer Motion 12.16.0** - анимации и переходы
- **Lucide React 0.511.0** - SVG иконки
- **Canvas Confetti 1.9.3** - эффекты конфетти

### Backend и синхронизация
- **Supabase 2.49.8** - Backend-as-a-Service
  - PostgreSQL база данных
  - Аутентификация (Email + Google OAuth)
  - Row Level Security (RLS)
  - Real-time subscriptions
- **IndexedDB (idb-keyval 6.2.2)** - локальное хранение

### Утилиты и вспомогательные библиотеки
- **UUID 11.1.0** - генерация уникальных идентификаторов
- **QRCode 1.5.4** - генерация QR кодов
- **Class Variance Authority** - условные CSS классы
- **Tailwind Merge** - объединение Tailwind классов
- **CLSX** - условные классы

### Инструменты разработки
- **ESLint** - линтер кода
- **Vitest** - тестирование
- **Testing Library** - тестирование React компонентов
- **TypeScript ESLint** - типы для ESLint
- **Autoprefixer** - автоматические CSS префиксы
- **PostCSS** - обработка CSS

### Деплой и CI/CD
- **GitHub Pages** - хостинг
- **GitHub Actions** - автоматический деплой
- **gh-pages** - утилита для деплоя

## Структура проекта

```
wishlist-site/
├── public/                 # Статические файлы
│   ├── icons/             # PWA иконки
│   │   ├── manifest.json      # PWA манифест
│   │   └── 404.html          # Страница 404
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   │   ├── ui/           # Переиспользуемые UI компоненты
│   │   │   └── index.ts      # Экспорты компонентов
│   │   ├── hooks/            # Кастомные React хуки
│   │   │   ├── __tests__/    # Тесты хуков
│   │   │   └── index.ts      # Экспорты хуков
│   │   ├── types/            # TypeScript типы
│   │   ├── utils/            # Утилиты и хелперы
│   │   │   ├── __tests__/    # Тесты утилит
│   │   │   └── legacy/       # Устаревший код
│   │   ├── config/           # Конфигурация
│   │   ├── data/             # Данные и API
│   │   └── test/             # Настройки тестирования
│   ├── memory-bank/          # Документация проекта
│   ├── supabase/            # Supabase конфигурация
│   └── dist/                # Собранное приложение
├── config/
└── data/
```

## Конфигурация окружения

### Переменные окружения
```env
# Supabase (опциональные - приложение работает без них)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# GitHub Pages
VITE_BASE_URL=/wishlist-checker/
```

### Vite конфигурация
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: '/wishlist-checker/',
  build: {
    outDir: 'dist'
  }
});
```

### Tailwind конфигурация
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Кастомные CSS переменные для тем
      colors: {
        'theme-background': 'var(--theme-background)',
        'theme-card': 'var(--theme-card)',
        'theme-primary': 'var(--theme-primary)',
        // ... другие цвета
      }
    }
  }
};
```

## Система тем

### CSS переменные
```css
/* index.css */
:root {
  /* Светлая тема */
  --theme-background: #f9fafb;
  --theme-card: #ffffff;
  --theme-primary: #111827;
  /* ... другие переменные */
}

:root.dark {
  /* Темная тема */
  --theme-background: #141414;
  --theme-card: #1f2937;
  --theme-primary: #f9fafb;
  /* ... другие переменные */
}
```

### Управление темами
- **useTheme хук** - централизованное управление
- **Системная тема** - автоматическое определение предпочтений ОС
- **Персистентность** - сохранение в localStorage и Supabase
- **Плавные переходы** - `transition-colors duration-200`

## PWA конфигурация

### Манифест
```json
{
  "name": "Wishlist checker",
  "short_name": "Wishlist",
  "start_url": "/wishlist-checker/",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#F9FAFB",
  "icons": [
    {
      "src": "icons/wishlist-icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### Service Worker
- Автоматическая генерация через Vite
- Кэширование статических ресурсов
- Offline функциональность

## База данных (Supabase)

### Схема таблиц
```sql
-- Товары вишлиста
CREATE TABLE wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  item_type TEXT,
  link TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'RUB',
  is_bought BOOLEAN DEFAULT false,
  comment TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Пользовательские настройки
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'auto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS политики
```sql
-- Пользователи видят только свои данные
CREATE POLICY "Users can only see their own wishlist items" 
ON wishlist_items FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own preferences" 
ON user_preferences FOR ALL 
USING (auth.uid() = user_id);
```

### Аутентификация
- **Magic Links** - вход по email без пароля
- **Google OAuth** - вход через Google аккаунт
- **Анонимное использование** - полная функциональность без входа

## Тестирование

### Настройка тестирования
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
});
```

### Стратегия тестирования
- **Unit тесты** - хуки и утилиты
- **Integration тесты** - компоненты с хуками
- **E2E тесты** - критические пользовательские сценарии (планируется)

### Покрытие тестами
- `useTheme` - тестирование системы тем
- `useWishlist` - тестирование управления товарами
- `priceCalculator` - тестирование расчетов

## Производительность

### Оптимизации
- **Мемоизация** - `useMemo` для дорогих вычислений
- **Ленивая загрузка** - `React.lazy` для компонентов
- **Дебаунсинг** - задержка для поиска и автосохранения
- **Виртуализация** - для больших списков (планируется)

### Метрики
- **Lighthouse Score** - 90+ по всем метрикам
- **Core Web Vitals** - соответствие стандартам Google
- **Bundle Size** - оптимизация размера сборки

## Безопасность

### Клиентская безопасность
- **XSS защита** - санитизация пользовательского ввода
- **CSRF защита** - токены аутентификации
- **Валидация данных** - проверка на клиенте и сервере

### Серверная безопасность
- **RLS** - доступ только к собственным данным
- **JWT токены** - безопасная аутентификация
- **HTTPS** - шифрование трафика

## Мониторинг и логирование

### Логирование
```typescript
// utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  }
};
```

### Мониторинг ошибок
- Консольное логирование в development
- Graceful error handling в production
- Пользовательские уведомления об ошибках

## Деплой и CI/CD

### GitHub Actions
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install and Build
        run: |
          npm ci
          npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
```

### Процесс деплоя
1. Push в main ветку
2. Автоматическая сборка через GitHub Actions
3. Деплой на GitHub Pages
4. Обновление кэша CDN

## Совместимость

### Браузеры
- **Chrome/Edge** - полная поддержка
- **Firefox** - полная поддержка
- **Safari** - полная поддержка с полифиллами
- **Mobile браузеры** - оптимизация для мобильных

### Устройства
- **Desktop** - Windows, macOS, Linux
- **Mobile** - iOS Safari, Android Chrome
- **Tablet** - адаптивный дизайн для планшетов

### Требования
- **JavaScript** - ES2020+
- **CSS** - Grid, Flexbox, CSS Variables
- **Storage** - localStorage, IndexedDB (опционально) 