-- =====================================================
-- СРОЧНОЕ ИСПРАВЛЕНИЕ: Восстановление RLS Policies
-- =====================================================

-- Сначала удаляем все существующие policies (если есть)
DROP POLICY IF EXISTS "Users can view own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can update own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.wishlist_items;

DROP POLICY IF EXISTS "Users can view own categories" ON public.user_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.user_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.user_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.user_categories;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- =====================================================
-- 1. POLICIES ДЛЯ WISHLIST_ITEMS
-- =====================================================

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
-- 2. POLICIES ДЛЯ USER_CATEGORIES
-- =====================================================

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
-- 3. POLICIES ДЛЯ USER_PREFERENCES
-- =====================================================

-- Политики для настроек
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. ПРОВЕРКА ЧТО ВСЁ РАБОТАЕТ
-- =====================================================

-- Проверяем что policies созданы
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('wishlist_items', 'user_categories', 'user_preferences')
ORDER BY tablename, policyname;

-- Проверяем что RLS включен
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('wishlist_items', 'user_categories', 'user_preferences');

-- =====================================================
-- ГОТОВО! Теперь policies должны работать
-- ===================================================== 