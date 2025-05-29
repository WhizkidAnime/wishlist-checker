import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface EmailDebugInfoProps {
  email: string;
}

export const EmailDebugInfo: React.FC<EmailDebugInfoProps> = ({ email }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  const { signInWithGoogle, isSupabaseAvailable } = useAuth();

  const handleTestEmailDelivery = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Пытаемся сделать запрос к Supabase для проверки настроек
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTestResult('✅ Supabase настроен правильно. Проблема может быть в настройках SMTP.');
      } else {
        setTestResult('❌ Проблема с настройками Supabase.');
      }
    } catch (error) {
      setTestResult('❌ Ошибка подключения к Supabase.');
    } finally {
      setTesting(false);
    }
  };

  const handleUseGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Ошибка входа через Google:', error);
    }
  };

  if (!isSupabaseAvailable) {
    return null;
  }

  return (
    <div className="mt-4 border border-theme-border rounded-lg p-4 bg-theme-background">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-theme-text hover:text-theme-primary transition-colors"
      >
        <span>🔧 Диагностика проблем с email</span>
        <svg 
          className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="text-xs text-theme-text-secondary space-y-2">
            <p><strong>Email для регистрации:</strong> {email}</p>
            <p><strong>Redirect URL:</strong> {window.location.origin}/wishlist-checker/auth/callback</p>
            <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'не настроен'}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-theme-text">Возможные причины:</h4>
            <ul className="text-xs text-theme-text-secondary space-y-1 list-disc list-inside">
              <li>В Supabase не настроен SMTP сервер</li>
              <li>Email провайдер блокирует письма</li>
              <li>Неправильные настройки домена в Supabase</li>
              <li>Письмо в папке "Спам"</li>
              <li>Лимиты на отправку email в Supabase</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTestEmailDelivery}
              disabled={testing}
              className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {testing ? 'Тестируем...' : 'Тест настроек'}
            </button>
            
            <button
              onClick={handleUseGoogle}
              className="px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Войти через Google
            </button>
          </div>

          {testResult && (
            <div className="text-xs p-2 rounded bg-theme-edit">
              {testResult}
            </div>
          )}

          <div className="text-xs text-theme-text-secondary bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Рекомендации:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Используйте Google вход как альтернативу</li>
              <li>Настройте SMTP в Supabase Dashboard</li>
              <li>Добавьте домен в Authentication Settings</li>
              <li>Проверьте Email Templates в Supabase</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 