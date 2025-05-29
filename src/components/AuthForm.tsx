import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EmailDebugInfo } from './EmailDebugInfo';

interface AuthFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export const AuthForm: React.FC<AuthFormProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const { 
    signInWithPassword, 
    signUpWithPassword, 
    signInWithGoogle, 
    resetPassword,
    resendConfirmation,
    isSupabaseAvailable 
  } = useAuth();

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage(null);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    clearForm();
  };

  const validateForm = () => {
    if (!email) {
      setError('Введите email адрес');
      return false;
    }

    if (mode === 'reset') {
      return true;
    }

    if (!password) {
      setError('Введите пароль');
      return false;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signin') {
        await signInWithPassword(email, password);
        setMessage('Вход выполнен успешно!');
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 1000);
        
      } else if (mode === 'signup') {
        const result = await signUpWithPassword(email, password);
        
        if (!result.user?.email_confirmed_at) {
          setMessage('Регистрация завершена! Проверьте почту и подтвердите email адрес. Если письма нет, проверьте папку "Спам".');
        } else {
          setMessage('Регистрация и вход выполнены успешно!');
          setTimeout(() => {
            onClose();
            onSuccess?.();
          }, 1000);
        }
        
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('Ссылка для сброса пароля отправлена на вашу почту');
      }
      
    } catch (error: any) {
      // Обработка специфичных ошибок Supabase
      if (error.message?.includes('Invalid login credentials')) {
        setError('Неверный email или пароль');
      } else if (error.message?.includes('User already registered')) {
        setError('Пользователь с таким email уже зарегистрирован. Попробуйте войти.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Email не подтвержден. Проверьте почту или отправьте письмо повторно.');
      } else if (error.message?.includes('For security purposes')) {
        setError('Подождите немного перед повторной попыткой регистрации.');
      } else {
        setError(`Ошибка: ${error.message || 'Произошла неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      onClose();
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || 'Ошибка входа через Google');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Введите email адрес');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resendConfirmation(email);
      setMessage('Письмо с подтверждением отправлено повторно');
    } catch (error: any) {
      setError(error.message || 'Ошибка отправки письма');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  if (!isSupabaseAvailable) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-theme-primary mb-4">
          Аутентификация недоступна
        </h2>
        <p className="text-theme-text mb-4">
          Для работы с аккаунтами необходимо настроить Supabase.
          Пока что ваши данные сохраняются только локально.
        </p>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:opacity-90 transition-colors"
        >
          Понятно
        </button>
      </div>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Вход в аккаунт';
      case 'signup': return 'Регистрация';
      case 'reset': return 'Сброс пароля';
    }
  };

  const getSubmitText = () => {
    if (loading) {
      switch (mode) {
        case 'signin': return 'Выполняется вход...';
        case 'signup': return 'Создается аккаунт...';
        case 'reset': return 'Отправляется письмо...';
      }
    }
    
    switch (mode) {
      case 'signin': return 'Войти';
      case 'signup': return 'Зарегистрироваться';
      case 'reset': return 'Отправить ссылку';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-theme-primary">
          {getTitle()}
        </h2>
        <button
          onClick={handleClose}
          className="text-theme-text hover:text-theme-primary text-xl transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Табы */}
      {mode !== 'reset' && (
        <div className="flex rounded-lg bg-theme-background border border-theme-border mb-6">
          <button
            onClick={() => handleModeChange('signin')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'signin' 
                ? 'bg-theme-primary text-white' 
                : 'text-theme-text hover:text-theme-primary'
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => handleModeChange('signup')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'signup' 
                ? 'bg-theme-primary text-white' 
                : 'text-theme-text hover:text-theme-primary'
            }`}
          >
            Регистрация
          </button>
        </div>
      )}

      {/* Описание */}
      <p className="text-theme-text text-sm mb-6">
        {mode === 'signin' && 'Войдите в свой аккаунт для синхронизации данных между устройствами'}
        {mode === 'signup' && 'Создайте аккаунт для сохранения и синхронизации ваших списков желаний'}
        {mode === 'reset' && 'Введите email для получения ссылки сброса пароля'}
      </p>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-theme-text mb-1">
            Email адрес
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 border border-theme-border rounded-lg 
                     bg-theme-background text-theme-text placeholder-theme-text-secondary
                     focus:outline-none focus:ring-2 focus:ring-theme-primary transition-colors"
            required
            disabled={loading}
          />
        </div>

        {/* Пароль */}
        {mode !== 'reset' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-theme-text mb-1">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full px-3 py-2 border border-theme-border rounded-lg 
                       bg-theme-background text-theme-text placeholder-theme-text-secondary
                       focus:outline-none focus:ring-2 focus:ring-theme-primary transition-colors"
              required
              disabled={loading}
              minLength={6}
            />
          </div>
        )}

        {/* Подтверждение пароля */}
        {mode === 'signup' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-text mb-1">
              Подтвердите пароль
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              className="w-full px-3 py-2 border border-theme-border rounded-lg 
                       bg-theme-background text-theme-text placeholder-theme-text-secondary
                       focus:outline-none focus:ring-2 focus:ring-theme-primary transition-colors"
              required
              disabled={loading}
              minLength={6}
            />
          </div>
        )}

        {/* Сообщения об ошибках и успехе */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="text-green-500 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            {message}
          </div>
        )}

        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-theme-primary text-white rounded-lg 
                   hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors font-medium"
        >
          {getSubmitText()}
        </button>
      </form>

      {/* Дополнительные действия */}
      {mode === 'signin' && (
        <div className="mt-4 text-center">
          <button
            onClick={() => handleModeChange('reset')}
            className="text-sm text-theme-primary hover:underline"
            disabled={loading}
          >
            Забыли пароль?
          </button>
        </div>
      )}

      {mode === 'reset' && (
        <div className="mt-4 text-center">
          <button
            onClick={() => handleModeChange('signin')}
            className="text-sm text-theme-primary hover:underline"
            disabled={loading}
          >
            Вернуться к входу
          </button>
        </div>
      )}

      {/* Кнопка повторной отправки подтверждения */}
      {mode === 'signup' && message && (
        <div className="mt-4 space-y-2">
          <div className="text-center">
            <button
              onClick={handleResendConfirmation}
              className="text-sm text-theme-primary hover:underline"
              disabled={loading}
            >
              Отправить письмо повторно
            </button>
          </div>
          
          {/* Информация о возможных проблемах */}
          <div className="text-xs text-theme-text-secondary bg-theme-background p-3 rounded-lg">
            <p className="font-medium mb-2">Если письмо не приходит:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Проверьте папку "Спам" или "Промоакции"</li>
              <li>Убедитесь, что email введен правильно</li>
              <li>Письмо может идти до 10 минут</li>
              <li>Попробуйте войти через Google</li>
            </ul>
          </div>

          {/* Компонент диагностики */}
          <EmailDebugInfo email={email} />
        </div>
      )}

      {/* Разделитель */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-theme-border"></div>
        <span className="px-3 text-sm text-theme-text-secondary">или</span>
        <div className="flex-1 border-t border-theme-border"></div>
      </div>

      {/* Кнопка Google */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full py-2 px-4 border border-theme-border text-theme-text rounded-lg 
                 hover:bg-theme-background-secondary disabled:opacity-50 disabled:cursor-not-allowed
                 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-2.7.75 4.8 4.8 0 0 1-4.52-3.29H1.83v2.07A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.46 10.48A4.8 4.8 0 0 1 4.21 9a4.8 4.8 0 0 1 .25-1.48V5.45H1.83A8 8 0 0 0 .98 9a8 8 0 0 0 .85 3.55l2.63-2.07z"/>
          <path fill="#EA4335" d="M8.98 4.75c1.23 0 2.33.42 3.2 1.25l2.4-2.4A8 8 0 0 0 8.98 1a8 8 0 0 0-7.15 4.45l2.63 2.07A4.8 4.8 0 0 1 8.98 4.75z"/>
        </svg>
        Войти через Google
      </button>

      {/* Информация о безопасности */}
      <p className="text-xs text-theme-text-secondary mt-4 text-center">
        Ваши данные защищены и не передаются третьим лицам
      </p>
    </div>
  );
}; 