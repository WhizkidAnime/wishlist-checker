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

        if (code) {
          // Обмениваем код на сессию
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            window.location.href = '/wishlist-checker/';
            return;
          }
        } else if (accessToken && refreshToken) {
          // Устанавливаем сессию из токенов
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            window.location.href = '/wishlist-checker/';
            return;
          }
        } else {
          // Проверяем на ошибки в URL
          const errorCode = urlParams.get('error') || hashParams.get('error');
          
          if (errorCode) {
            // Ошибка в URL
          }
        }

        // Ждем немного для обновления состояния
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Перенаправляем на главную страницу
        window.location.href = '/wishlist-checker/';
        
      } catch (error) {
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