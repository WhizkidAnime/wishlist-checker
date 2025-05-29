import { useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';

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

    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/wishlist-checker/auth/callback`
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
      redirectTo: `${window.location.origin}/wishlist-checker/auth/callback`
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
        emailRedirectTo: `${window.location.origin}/wishlist-checker/auth/callback`
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
        emailRedirectTo: `${window.location.origin}/wishlist-checker/auth/callback`
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

    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/wishlist-checker/auth/callback`
      }
    });

    if (error) {
      throw error;
    }
  };

  // Выход
  const signOut = async () => {
    if (!isSupabaseAvailable()) {
      return;
    }

    const { error } = await supabase!.auth.signOut();
    if (error) {
      throw error;
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