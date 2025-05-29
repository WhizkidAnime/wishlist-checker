# 🔧 Настройка переменных окружения для Supabase

## Шаг 3: Создание файла .env.local

После получения API ключей из Supabase Dashboard создайте файл `.env.local` в корне проекта:

```bash
# Supabase Configuration
# Получите эти значения из: https://supabase.com/dashboard/project/[your-project-id]/settings/api

# Project URL (замените на ваш)
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Public anon key (замените на ваш)  
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Пример заполненного .env.local:

```bash
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk5MjA1NzMsImV4cCI6MTk4NTQ5NjU3M30...
```

## ⚠️ Важные примечания:

1. **Файл .env.local должен находиться в корне проекта** (рядом с package.json)
2. **Не добавляйте .env.local в git** (он уже в .gitignore)
3. **anon key можно показывать публично** - безопасность через RLS
4. **service_role key НИКОГДА не используйте в frontend**

## 🔄 После создания файла:

1. Перезапустите dev сервер: `npm run dev`
2. Проверьте консоль браузера - должно появиться:
   ```
   ✅ Supabase client initialized successfully
   ```

## 🔍 Где появится интерфейс входа:

После создания .env.local вы увидите:
- **Desktop**: Кнопка "Войти" в правом верхнем углу 
- **Mobile**: Кнопка "Войти" рядом с заголовком
- **Индикатор синхронизации** в разделе "Список желаний" 