import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseAvailable } from '../utils/supabaseClient';

export const AuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔄 AuthCallback: Начинаем обработку...');
      console.log('🌐 AuthCallback: URL:', window.location.href);
      console.log('🔍 AuthCallback: Search params:', window.location.search);
      console.log('📍 AuthCallback: Hash:', window.location.hash);
      
      if (!isSupabaseAvailable()) {
        console.error('❌ AuthCallback: Supabase недоступен');
        setError('Supabase недоступен');
        setLoading(false);
        return;
      }

      try {
        // Получаем параметры из URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.slice(1)); // убираем #
        
        console.log('📋 AuthCallback: URL params:', Object.fromEntries(urlParams));
        console.log('📋 AuthCallback: Hash params:', Object.fromEntries(hashParams));
        
        // Проверяем разные способы получения токенов
        const code = urlParams.get('code') || hashParams.get('code');
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        
        console.log('🔑 AuthCallback: Code:', code ? 'найден' : 'не найден');
        console.log('🔑 AuthCallback: Access token:', accessToken ? 'найден' : 'не найден');
        console.log('🔑 AuthCallback: Refresh token:', refreshToken ? 'найден' : 'не найден');
        
        if (code) {
          console.log('✅ AuthCallback: Используем code flow');
          // Обмениваем код на сессию
          const { data, error } = await supabase!.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ AuthCallback: Ошибка exchangeCodeForSession:', error);
            throw error;
          }
          
          console.log('✅ AuthCallback: Сессия получена:', data.session?.user?.email);
          
        } else if (accessToken && refreshToken) {
          console.log('✅ AuthCallback: Используем token flow');
          // Устанавливаем сессию с токенами
          const { data, error } = await supabase!.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('❌ AuthCallback: Ошибка setSession:', error);
            throw error;
          }
          
          console.log('✅ AuthCallback: Сессия установлена:', data.session?.user?.email);
          
        } else {
          console.warn('⚠️ AuthCallback: Токены не найдены');
          // Нет токенов - возможно, ошибка
          const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
          const errorCode = urlParams.get('error') || hashParams.get('error');
          
          if (errorDescription || errorCode) {
            console.error('❌ AuthCallback: Ошибка в URL:', { errorCode, errorDescription });
            throw new Error(errorDescription || `Ошибка: ${errorCode}`);
          }
        }
        
        // Ждем немного для обновления состояния
        console.log('⏳ AuthCallback: Ждем обновления состояния...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Перенаправляем на главную
        console.log('🏠 AuthCallback: Перенаправляем на главную...');
        window.location.href = '/wishlist-checker/';
        
      } catch (error) {
        console.error('❌ AuthCallback: Ошибка обработки:', error);
        setError(error instanceof Error ? error.message : 'Произошла ошибка');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
          <p className="text-theme-text">Завершаем вход в аккаунт...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Автоматическое перенаправление через 3 секунды при ошибке
    React.useEffect(() => {
      const timer = setTimeout(() => {
        window.location.href = '/wishlist-checker/';
      }, 3000);
      
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-amber-500 text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-theme-primary mb-2">
            Ссылка истекла
          </h1>
          <p className="text-theme-text mb-4">
            Магическая ссылка больше недействительна. Пожалуйста, запросите новую ссылку для входа.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Автоматическое перенаправление через 3 секунды...
          </p>
          <button
            onClick={() => window.location.href = '/wishlist-checker/'}
            className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return null;
}; 