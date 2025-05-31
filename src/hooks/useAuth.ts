import { useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';
import { getRedirectUrl, debugAuthUrls } from '../utils/authRedirect';
import { logger } from '../utils/logger';
import { 
  isIOSPWA, 
  isIOSSafari, 
  getRecommendedOAuthMethod, 
  showIOSOAuthWarning,
  getIOSOAuthErrorMessage,
  logDeviceInfo 
} from '../utils/iosSupport';

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
          // console.error('❌ Ошибка получения сессии:', error);
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false
          });
        }
        
        setAuthState({
          user: session?.user || null,
          session: session,
          loading: false,
          isAuthenticated: !!session?.user
        });
      } catch (error) {
        // console.error('❌ Ошибка инициализации аутентификации:', error);
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
          logger.auth(`${event === 'SIGNED_IN' ? 'Вход' : 'Выход'}: ${session?.user?.email || 'анонимно'}`);
          
          // Дополнительная отладка для Google OAuth
          if (event === 'SIGNED_IN' && session?.user) {
            // console.log('🔍 Данные пользователя при входе:', {
            //   user_metadata: session.user.user_metadata,
            //   identities: session.user.identities,
            //   app_metadata: session.user.app_metadata
            // });
          }
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
      logDeviceInfo();
    }

    // Показываем предупреждение для iOS PWA пользователей
    if (!showIOSOAuthWarning()) {
      return;
    }

    const oauthMethod = getRecommendedOAuthMethod();
    
    try {
      if (oauthMethod === 'external' && isIOSPWA()) {
        // Для iOS PWA открываем в внешнем браузере
        const authUrl = `https://umvghchvnsuqnxrvzhct.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(getRedirectUrl())}&prompt=select_account`;
        window.open(authUrl, '_blank');
        return;
      }

      // Стандартный OAuth flow
      const { error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      // Специальная обработка ошибок для iOS
      const errorMessage = getIOSOAuthErrorMessage(error);
      throw new Error(errorMessage);
    }
  };

  // Выход
  const signOut = async () => {
    logger.auth(`useAuth: Начинаем выход пользователя: ${authState.user?.email}`);
    
    try {
      // 1. Выход из Supabase
      if (isSupabaseAvailable() && supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      
      // 2. Очистка всех Supabase ключей
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // 3. Обновление UI компонентов
      logger.auth('Обновляем UI компоненты...');
      window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
      
      logger.auth('Выход завершён успешно');
    } catch (error) {
      // console.error('❌ Ошибка при выходе:', error);
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