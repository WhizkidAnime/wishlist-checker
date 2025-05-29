# Настройка Email в Supabase

## Проблема
Пользователи не получают письма с подтверждением при регистрации через email и пароль.

## Возможные причины

### 1. SMTP не настроен в Supabase
По умолчанию Supabase использует встроенный email сервис, который может быть ненадежным.

**Решение:**
1. Зайдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в `Settings` → `Authentication`
4. Настройте SMTP:
   - **SMTP Host**: smtp.gmail.com (для Gmail)
   - **SMTP Port**: 587
   - **SMTP User**: ваш email
   - **SMTP Password**: пароль приложения
   - **Sender Email**: ваш email
   - **Sender Name**: имя отправителя

### 2. Неправильный Site URL
Неправильный домен в настройках может блокировать отправку писем.

**Решение:**
1. В `Settings` → `Authentication` проверьте:
   - **Site URL**: `https://yourdomain.com/wishlist-checker/`
   - **Additional Redirect URLs**: добавьте все возможные URL

### 3. Email Templates
Проблемы с шаблонами писем.

**Решение:**
1. В `Authentication` → `Email Templates`
2. Проверьте шаблон "Confirm your signup"
3. Убедитесь, что ссылка правильная: `{{ .ConfirmationURL }}`

### 4. Rate Limits
Превышены лимиты на отправку email.

**Решение:**
1. В `Settings` → `Authentication` → `Rate Limits`
2. Увеличьте лимиты или подождите

## Пошаговая диагностика

### Шаг 1: Проверка консоли браузера
1. Откройте DevTools (F12)
2. Попробуйте зарегистрироваться
3. Смотрите логи в консоли

### Шаг 2: Проверка Supabase Dashboard
1. Зайдите в `Authentication` → `Users`
2. Найдите созданного пользователя
3. Проверьте статус: `email_confirmed_at` должен быть `null`

### Шаг 3: Проверка логов Supabase
1. В Dashboard перейдите в `Logs`
2. Фильтруйте по `auth`
3. Ищите ошибки отправки email

## Альтернативные решения

### 1. Использование Google OAuth
Самый надежный способ - использовать Google вход:
```typescript
await signInWithGoogle();
```

### 2. Временное отключение подтверждения email
В `Settings` → `Authentication`:
- Отключите "Enable email confirmations"
- **Внимание**: это снижает безопасность

### 3. Использование внешнего SMTP
Настройте SendGrid, Mailgun или другой сервис.

## Тестирование настроек

### 1. Тест через Supabase CLI
```bash
supabase functions serve
curl -X POST 'http://localhost:54321/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 2. Тест через браузер
Используйте компонент диагностики в приложении.

## Конфигурация для разработки

### Local Development
Для локальной разработки используйте:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

### Production
Для продакшена убедитесь в правильности:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Полезные ссылки

- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

## Чек-лист исправления

- [ ] SMTP настроен в Supabase Dashboard
- [ ] Site URL правильный
- [ ] Email templates не повреждены
- [ ] Rate limits не превышены
- [ ] Домен добавлен в Redirect URLs
- [ ] Тестирование с альтернативным email
- [ ] Проверка папки "Спам"
- [ ] Логи Supabase проверены 