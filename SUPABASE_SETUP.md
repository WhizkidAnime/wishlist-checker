# Настройка Supabase для проекта Wishlist

## 1. Создание проекта Supabase

1. Перейдите на [https://supabase.com](https://supabase.com)
2. Создайте аккаунт или войдите в существующий
3. Нажмите "New Project"
4. Выберите организацию и заполните:
   - **Project name**: `wishlist-app`
   - **Database Password**: создайте надежный пароль
   - **Region**: выберите ближайший к вашим пользователям
5. Нажмите "Create new project"

## 2. Получение ключей API

После создания проекта:

1. Перейдите в Settings → API
2. Скопируйте:
   - **URL**: ваш Project URL
   - **anon/public key**: публичный ключ для клиентских запросов

## 3. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=ваш_supabase_url
VITE_SUPABASE_ANON_KEY=ваш_supabase_anon_key
```

## 4. Установка зависимостей

```bash
npm install @supabase/supabase-js
```

## 5. Настройка базы данных

Выполните SQL-скрипт из файла `supabase/schema.sql` в SQL Editor вашего проекта Supabase.

## 6. Настройка аутентификации

### Email Authentication (Magic Links)

1. В Supabase Dashboard перейдите в Authentication → Settings
2. В разделе "Auth Providers" убедитесь, что Email включен
3. В разделе "Email Templates" настройте шаблоны писем (опционально)

### Google OAuth (опционально)

1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com/)
2. Включите Google+ API
3. Создайте OAuth 2.0 credentials
4. В Supabase Dashboard перейдите в Authentication → Providers
5. Включите Google provider и добавьте ваши Client ID и Client Secret
6. Добавьте redirect URL: `https://ваш-проект.supabase.co/auth/v1/callback`

## 7. Настройка URL для редиректов

В Authentication → URL Configuration добавьте:
- Site URL: `http://localhost:5173` (для разработки)
- Redirect URLs: 
  - `http://localhost:5173/auth/callback`
  - `https://ваш-домен.com/auth/callback` (для продакшена)

## 8. Row Level Security (RLS)

RLS политики уже настроены в schema.sql. Они обеспечивают:
- Пользователи видят только свои данные
- Автоматическое присвоение user_id при создании записей
- Защиту от несанкционированного доступа

## 9. Тестирование

1. Запустите проект: `npm run dev`
2. Попробуйте войти через email или Google
3. Добавьте несколько товаров в вишлист
4. Проверьте синхронизацию между устройствами

## 10. Развертывание

При развертывании на GitHub Pages или другом хостинге:

1. Обновите переменные окружения для продакшена
2. Добавьте ваш домен в Redirect URLs
3. Обновите Site URL в настройках аутентификации

## Возможные проблемы

### Ошибка CORS
Убедитесь, что ваш домен добавлен в список разрешенных в настройках Supabase.

### Проблемы с аутентификацией
Проверьте правильность настройки redirect URLs и переменных окружения.

### Проблемы с синхронизацией
Убедитесь, что RLS политики применены корректно и пользователь аутентифицирован.

## Полезные ссылки

- [Документация Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) 