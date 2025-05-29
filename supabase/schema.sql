    -- =====================================================
    -- Схема базы данных для приложения Wishlist
    -- =====================================================

    -- Включаем Row Level Security для всех таблиц
    -- (пользователи будут видеть только свои данные)

    -- =====================================================
    -- 1. Таблица элементов вишлиста
    -- =====================================================

    CREATE TABLE public.wishlist_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        item_type TEXT,
        link TEXT DEFAULT '',
        price DECIMAL(10,2) DEFAULT 0,
        currency TEXT DEFAULT 'RUB',
        is_bought BOOLEAN DEFAULT FALSE,
        comment TEXT DEFAULT '',
        category TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Включаем RLS
    ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

    -- Политика: пользователи видят только свои элементы
    CREATE POLICY "Users can view own wishlist items" ON public.wishlist_items
        FOR SELECT USING (auth.uid() = user_id);

    -- Политика: пользователи могут создавать свои элементы
    CREATE POLICY "Users can insert own wishlist items" ON public.wishlist_items
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Политика: пользователи могут обновлять свои элементы
    CREATE POLICY "Users can update own wishlist items" ON public.wishlist_items
        FOR UPDATE USING (auth.uid() = user_id);

    -- Политика: пользователи могут удалять свои элементы
    CREATE POLICY "Users can delete own wishlist items" ON public.wishlist_items
        FOR DELETE USING (auth.uid() = user_id);

    -- =====================================================
    -- 2. Таблица категорий пользователей
    -- =====================================================

    CREATE TABLE public.user_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, name)
    );

    -- Включаем RLS
    ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

    -- Политики для категорий
    CREATE POLICY "Users can view own categories" ON public.user_categories
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own categories" ON public.user_categories
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own categories" ON public.user_categories
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own categories" ON public.user_categories
        FOR DELETE USING (auth.uid() = user_id);

    -- =====================================================
    -- 3. Таблица пользовательских настроек
    -- =====================================================

    CREATE TABLE public.user_preferences (
        user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
        last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Включаем RLS
    ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

    -- Политики для настроек
    CREATE POLICY "Users can view own preferences" ON public.user_preferences
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own preferences" ON public.user_preferences
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own preferences" ON public.user_preferences
        FOR UPDATE USING (auth.uid() = user_id);

    -- =====================================================
    -- 4. Индексы для производительности
    -- =====================================================

    -- Индексы для wishlist_items
    CREATE INDEX idx_wishlist_items_user_id ON public.wishlist_items(user_id);
    CREATE INDEX idx_wishlist_items_category ON public.wishlist_items(category);
    CREATE INDEX idx_wishlist_items_is_bought ON public.wishlist_items(is_bought);
    CREATE INDEX idx_wishlist_items_created_at ON public.wishlist_items(created_at);

    -- Индексы для категорий
    CREATE INDEX idx_user_categories_user_id ON public.user_categories(user_id);

    -- =====================================================
    -- 5. Функции для автоматического обновления timestamps
    -- =====================================================

    -- Функция для обновления updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Триггеры для автоматического обновления updated_at
    CREATE TRIGGER update_wishlist_items_updated_at 
        BEFORE UPDATE ON public.wishlist_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_user_preferences_updated_at 
        BEFORE UPDATE ON public.user_preferences
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- =====================================================
    -- 6. Функция инициализации пользователя
    -- =====================================================

    -- Функция для создания настроек пользователя при регистрации
    CREATE OR REPLACE FUNCTION init_user_preferences()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO public.user_preferences (user_id, theme)
        VALUES (NEW.id, 'light')
        ON CONFLICT (user_id) DO NOTHING;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Триггер для автоматического создания настроек
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION init_user_preferences();

    -- =====================================================
    -- Схема готова к использованию!
    -- ===================================================== 