import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export const AuthCallback: React.FC = () => {
  const [loading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      if (!supabase) {
        window.location.href = '/wishlist-checker/';
        return;
      }

      try {
        // Получаем параметры из URL и hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );

        // Ищем нужные параметры в обоих местах
        const code = urlParams.get('code') || hashParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorCode = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        // Детекция iOS PWA режима
        const isIOSPWA = () => {
          return (
            'standalone' in window.navigator &&
            (window.navigator as any).standalone === true &&
            /iPad|iPhone|iPod/.test(navigator.userAgent)
          );
        };

        // Логирование для отладки
        console.log('🔍 Auth Callback Debug:', {
          code: !!code,
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          errorCode,
          errorDescription,
          isIOSPWA: isIOSPWA(),
          url: window.location.href,
          search: window.location.search,
          hash: window.location.hash
        });

        if (errorCode) {
          console.error('❌ OAuth Error:', errorCode, errorDescription);
          // Для iOS PWA пробуем альтернативный подход
          if (isIOSPWA() && errorCode === 'access_denied') {
            // Возможно, пользователь отменил вход - просто перенаправляем
            window.location.href = '/wishlist-checker/';
            return;
          }
          // Для других ошибок тоже перенаправляем на главную
          window.location.href = '/wishlist-checker/';
          return;
        }

        if (code) {
          // Обмениваем код на сессию
          console.log('🔄 Exchanging code for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ Code exchange error:', error);
            window.location.href = '/wishlist-checker/';
            return;
          }
          console.log('✅ Code exchange successful');
        } else if (accessToken && refreshToken) {
          // Устанавливаем сессию из токенов
          console.log('🔄 Setting session from tokens...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('❌ Session set error:', error);
            window.location.href = '/wishlist-checker/';
            return;
          }
          console.log('✅ Session set successful');
        } else {
          console.warn('⚠️ No auth parameters found, redirecting...');
          window.location.href = '/wishlist-checker/';
          return;
        }

        // Ждем немного для обновления состояния
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Для iOS PWA используем специальную логику перенаправления
        if (isIOSPWA()) {
          // Для PWA пытаемся использовать history API
          try {
            window.history.replaceState({}, '', '/wishlist-checker/');
            window.location.reload();
          } catch (e) {
            window.location.href = '/wishlist-checker/';
          }
        } else {
          // Стандартное перенаправление
          window.location.href = '/wishlist-checker/';
        }
        
      } catch (error) {
        console.error('❌ Auth callback error:', error);
        window.location.href = '/wishlist-checker/';
      }
    };

    handleAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
          <p className="text-theme-text">Завершаем вход в аккаунт...</p>
          <p className="text-theme-text-secondary text-sm mt-2">
            Если процесс затягивается, попробуйте обновить страницу
          </p>
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
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-theme-primary mb-4">
            Ошибка входа
          </h2>
          <p className="text-theme-text mb-4">{error}</p>
          <p className="text-theme-text-secondary text-sm">
            Автоматическое перенаправление через 3 секунды...
          </p>
          <button
            onClick={() => window.location.href = '/wishlist-checker/'}
            className="mt-4 px-4 py-2 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return null;
}; 