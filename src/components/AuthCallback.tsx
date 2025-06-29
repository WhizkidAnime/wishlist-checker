import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useSystemTheme, getSystemThemeClasses } from '../utils/systemTheme';
import { ErrorPage } from './ErrorPage';

export const AuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Системная тема для экрана загрузки
  const systemTheme = useSystemTheme();
  const systemThemeClasses = getSystemThemeClasses(systemTheme);

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
          
          let errorMessage = '';
          let shouldRedirect = false;
          
          if (errorCode === 'access_denied') {
            if (isIOSPWA()) {
              shouldRedirect = true; // Для iOS PWA сразу перенаправляем
            } else {
              errorMessage = 'Вход отменен пользователем';
            }
          } else {
            errorMessage = `Ошибка OAuth: ${errorDescription || errorCode}`;
          }
          
          if (shouldRedirect) {
            window.location.href = '/wishlist-checker/';
            return;
          } else if (errorMessage) {
            setError(errorMessage);
            setLoading(false);
            return;
          }
        }

        if (code) {
          // Обмениваем код на сессию
          console.log('🔄 Exchanging code for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ Code exchange error:', error);
            setError('Ошибка при обмене кода авторизации');
            setLoading(false);
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
            setError('Ошибка при установке сессии');
            setLoading(false);
            return;
          }
          console.log('✅ Session set successful');
        } else {
          console.warn('⚠️ No auth parameters found, redirecting...');
          setError('Не найдены параметры авторизации');
          setLoading(false);
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
        setError('Произошла неожиданная ошибка при авторизации');
        setLoading(false);
      }
    };

    handleAuth();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${systemThemeClasses.background} transition-colors duration-200`}>
        <div className={`${systemThemeClasses.card} rounded-3xl shadow-lg p-8 text-center max-w-md mx-4 border ${systemThemeClasses.border}`}>
          <div className={`animate-spin rounded-full h-16 w-16 border-4 ${systemThemeClasses.spinner} mx-auto mb-6`}></div>
          <h2 className={`text-xl font-semibold ${systemThemeClasses.primary} mb-2`}>
            Завершаем вход в аккаунт...
          </h2>
          <p className={`${systemThemeClasses.textSecondary} text-sm`}>
            Если процесс затягивается, попробуйте обновить страницу
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorPage
        errorCode="🔐"
        title="Ошибка авторизации"
        description={error}
        onReturnHome={() => window.location.href = '/wishlist-checker/'}
        showReturnButton={true}
      />
    );
  }

  return null;
}; 