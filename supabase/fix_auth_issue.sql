-- Исправление проблемы с аутентификацией
-- Выполните этот скрипт в SQL Editor Supabase

-- 1. Удаляем проблемный триггер если он есть
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Удаляем функцию если она есть
DROP FUNCTION IF EXISTS init_user_preferences();

-- 3. Пересоздаем функцию с улучшенной обработкой ошибок
CREATE OR REPLACE FUNCTION init_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Используем более безопасный подход
    BEGIN
        INSERT INTO public.user_preferences (user_id, theme)
        VALUES (NEW.id, 'light')
        ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Игнорируем ошибки, чтобы не блокировать создание пользователя
        RAISE LOG 'Error creating user preferences for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 4. Пересоздаем триггер
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION init_user_preferences();

-- 5. Проверяем что таблица user_preferences доступна
SELECT COUNT(*) FROM public.user_preferences;

-- Готово! 