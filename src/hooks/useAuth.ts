import { useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';
import { getRedirectUrl, debugAuthUrls } from '../utils/authRedirect';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    // Если Supabase недоступен, остаемся в анонимном режиме
    if (!isSupabaseAvailable()) {
      setAuthState({
        user: null,
        session: null,
        loading: false,
        isAuthenticated: false
      });
      return;
    }

    // Получаем текущую сессию
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase!.auth.getSession();
        if (error) {
          console.error('❌ Ошибка получения сессии:', error);
        }
        
        setAuthState({
          user: session?.user || null,
          session: session,
          loading: false,
          isAuthenticated: !!session?.user
        });
      } catch (error) {
        console.error('❌ Ошибка инициализации аутентификации:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false
        });
      }
    };

    getSession();

    // Подписываемся на изменения аутентификации
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // Логируем только важные события
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          console.log(`🔐 ${event === 'SIGNED_IN' ? 'Вход' : 'Выход'}:`, session?.user?.email || 'анонимно');
        }
        
        setAuthState({
          user: session?.user || null,
          session: session,
          loading: false,
          isAuthenticated: !!session?.user
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Регистрация с email и паролем
  const signUpWithPassword = async (email: string, password: string) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase недоступен');
    }

    // Отладочная информация
    if (process.env.NODE_ENV === 'development') {
      debugAuthUrls();
    }

    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl()
      }
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // Вход с email и паролем
  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase недоступен');
    }

    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // Отправка ссылки для сброса пароля
  const resetPassword = async (email: string) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase недоступен');
    }

    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl()
    });

    if (error) {
      throw error;
    }
  };

  // Подтверждение email (повторная отправка)
  const resendConfirmation = async (email: string) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase недоступен');
    }

    const { error } = await supabase!.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getRedirectUrl()
      }
    });

    if (error) {
      throw error;
    }
  };

  // Вход через email (magic link) - оставляем для совместимости
  const signInWithEmail = async (email: string) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase недоступен');
    }

    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getRedirectUrl()
      }
    });

    if (error) {
      throw error;
    }
  };

  // Вход через Google
  const signInWithGoogle = async () => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase недоступен');
    }

    // Отладочная информация
    if (process.env.NODE_ENV === 'development') {
      debugAuthUrls();
    }

    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl()
      }
    });

    if (error) {
      throw error;
    }
  };

  // Выход
  const signOut = async () => {
    console.log('🚪 useAuth: signOut вызван');
    console.log('🔧 useAuth: isSupabaseAvailable:', isSupabaseAvailable());
    
    if (!isSupabaseAvailable()) {
      console.log('⚠️ useAuth: Supabase недоступен, выходим без запроса');
      return;
    }

    console.log('🔄 useAuth: Отправляем запрос на выход в Supabase...');
    
    try {
      const { error } = await supabase!.auth.signOut();
      if (error) {
        console.error('❌ useAuth: Ошибка выхода от Supabase:', error);
        
        // Если это ошибка "сессия отсутствует", то это нормально - просто очищаем локально
        if (error.message?.includes('Auth session missing') || error.message?.includes('session not found')) {
          console.log('ℹ️ useAuth: Сессия уже недействительна, очищаем локально');
        } else {
          // Для других ошибок все равно выбрасываем исключение
          throw error;
        }
      }
      
      console.log('✅ useAuth: Supabase вернул успешный результат выхода');
      
      // Дополнительная очистка localStorage для полного выхода
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🧹 useAuth: Очищены Supabase ключи из localStorage:', keysToRemove);
      } catch (storageError) {
        console.warn('⚠️ useAuth: Не удалось очистить localStorage:', storageError);
      }
    } catch (error) {
      console.error('❌ useAuth: Критическая ошибка выхода:', error);
      
      // Независимо от ошибки, принудительно очищаем локальное состояние
      console.log('🧹 useAuth: Принудительная очистка локального состояния...');
      setAuthState({
        user: null,
        session: null,
        loading: false,
        isAuthenticated: false
      });
      
      // Очищаем все данные Supabase из localStorage
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🧹 useAuth: Очищены Supabase ключи из localStorage:', keysToRemove);
      } catch (storageError) {
        console.warn('⚠️ useAuth: Не удалось очистить localStorage:', storageError);
      }
      
      // Не выбрасываем ошибку - считаем выход успешным
      return;
    }
  };

  return {
    ...authState,
    signUpWithPassword,
    signInWithPassword,
    resetPassword,
    resendConfirmation,
    signInWithEmail, // Оставляем для совместимости
    signInWithGoogle,
    signOut,
    isSupabaseAvailable: isSupabaseAvailable()
  };
}; 