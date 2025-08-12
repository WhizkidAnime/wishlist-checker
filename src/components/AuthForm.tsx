import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

interface PasswordRequirement {
  id: string;
  text: string;
  validator: (password: string) => boolean;
}

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

  // Требования к паролю
  const passwordRequirements: PasswordRequirement[] = [
    {
      id: 'length',
      text: 'Минимум 8 символов',
      validator: (pwd) => pwd.length >= 8
    },
    {
      id: 'latin',
      text: 'Латинские буквы',
      validator: (pwd) => /[a-zA-Z]/.test(pwd)
    },
    {
      id: 'uppercase',
      text: 'Заглавные буквы',
      validator: (pwd) => /[A-Z]/.test(pwd)
    },
    {
      id: 'digits',
      text: 'Цифры',
      validator: (pwd) => /\d/.test(pwd)
    },
    {
      id: 'special',
      text: 'Специальные символы',
      validator: (pwd) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(pwd)
    }
  ];

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

  const validatePassword = (password: string): boolean => {
    return passwordRequirements.every(req => req.validator(password));
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

    // Для регистрации проверяем требования к паролю
    if (mode === 'signup') {
      if (!validatePassword(password)) {
        setError('Пароль не соответствует требованиям');
        return false;
      }

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
        
      } else if (mode === 'signup') {
        const result = await signUpWithPassword(email, password);
        
        if (!result.user?.email_confirmed_at) {
          setMessage('Регистрация завершена! Проверьте почту и подтвердите email адрес. Если письма нет, проверьте папку "Спам".');
        } else {
          setMessage('Регистрация и вход выполнены успешно!');
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
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-theme-primary mb-4">
          Аутентификация недоступна
        </h2>
        <p className="text-theme-text-secondary text-sm mb-6 leading-relaxed">
          Для работы с аккаунтами необходимо настроить Supabase.
          Пока что ваши данные сохраняются только локально.
        </p>
        <button
          onClick={handleClose}
          className="px-6 py-2.5 bg-theme-primary text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-sm"
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

  // Компактная подсказка к паролю (вместо подробного списка требований)
  const PasswordHint: React.FC = () => (
    <p className="mt-2 text-xs text-theme-text-secondary">
      Минимум 8 символов. Используйте латиницу и цифры.
    </p>
  );

  const ConfirmPasswordIndicator: React.FC = () => (
    <>
      {confirmPassword && (
        <div
          className={`flex items-center gap-2 text-xs mt-2 transition-colors duration-300 ${
            password === confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              password === confirmPassword ? 'bg-green-500' : 'bg-red-400'
            }`}
          />
          <span>{password === confirmPassword ? 'Пароли совпадают' : 'Пароли не совпадают'}</span>
          {password === confirmPassword && (
            <div className="ml-auto transition-all duration-300 opacity-100 scale-100">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="w-full max-h-[90vh] flex flex-col">
      {/* Шапка */}
      <div className="relative px-6 pt-6 pb-4 border-b border-theme-border/10 flex-shrink-0 bg-theme-card">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-theme-text-secondary hover:text-theme-text hover:bg-theme-background-secondary rounded-xl transition-all"
          aria-label="Закрыть"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-xl font-semibold text-theme-text">{getTitle()}</h2>
        <p className="text-sm text-theme-text-secondary mt-1">
          {mode === 'signin' && 'Войдите, чтобы синхронизировать ваши списки'}
          {mode === 'signup' && 'Создайте аккаунт для синхронизации списков'}
          {mode === 'reset' && 'Введите email для получения ссылки сброса пароля'}
        </p>
      </div>

      {/* Основной контент */}
      <div className="px-6 pb-6 flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
        {/* Табы вход/регистрация */}
        {mode !== 'reset' && (
          <div className="mt-5 mb-5">
            <div className="grid grid-cols-2 p-1 rounded-xl border border-theme-border bg-theme-background-secondary">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className={`py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'signin' ? 'bg-theme-button text-theme-button' : 'text-theme-text-secondary hover:text-theme-text'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'signup' ? 'bg-theme-button text-theme-button' : 'text-theme-text-secondary hover:text-theme-text'
                }`}
              >
                Регистрация
              </button>
            </div>
          </div>
        )}

        {/* Форма с плавной анимацией высоты */}
        <div className="transition-all duration-300 ease-in-out">
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-theme-text">
              Email адрес
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 text-sm border border-theme-border rounded-xl 
                       bg-theme-background text-theme-text placeholder-theme-text-secondary/70 placeholder:text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900/15 dark:focus:ring-gray-500/30 focus:border-gray-900 dark:focus:border-gray-500
                       transition-all duration-200"
              required
              disabled={loading}
            />
          </div>

          {/* Пароль */}
          {mode !== 'reset' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-theme-text">Пароль</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => handleModeChange('reset')}
                    className="text-xs text-theme-primary hover:text-theme-primary/80"
                    disabled={loading}
                  >
                    Забыли пароль?
                  </button>
                )}
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signin' ? 'Введите пароль' : 'Минимум 8 символов'}
                className="w-full h-11 px-3 text-sm border border-theme-border rounded-xl bg-theme-background text-theme-text placeholder-theme-text-secondary/70 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/15 dark:focus:ring-gray-500/30 focus:border-gray-900 dark:focus:border-gray-500 transition-all"
                required
                disabled={loading}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              {mode === 'signup' && (<PasswordHint />)}
            </div>
          )}

          {/* Подтверждение пароля */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-text">
                Подтвердите пароль
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                className="w-full h-11 px-3 text-sm border border-theme-border rounded-xl bg-theme-background text-theme-text placeholder-theme-text-secondary/70 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/15 dark:focus:ring-gray-500/30 focus:border-gray-900 dark:focus:border-gray-500 transition-all"
                required
                disabled={loading}
                autoComplete="new-password"
              />
              
              {/* Индикатор совпадения паролей */}
              <ConfirmPasswordIndicator />
            </div>
          )}

          {/* Сообщения об ошибках и успехе */}
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800/30">
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-800/30">
              {message}
            </div>
          )}

          {/* Кнопка отправки */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-theme-button text-theme-button rounded-xl 
                     hover:bg-theme-button disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
          >
            {getSubmitText()}
          </button>
          </form>

          {mode === 'reset' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => handleModeChange('signin')}
                className="text-sm text-theme-primary hover:text-theme-primary/80 transition-colors duration-200"
                disabled={loading}
              >
                Вернуться к входу
              </button>
            </div>
          )}

          {/* Кнопка повторной отправки подтверждения */}
          {mode === 'signup' && message && (
            <div className="mt-5 space-y-3">
              <div className="text-center">
                <button
                  onClick={handleResendConfirmation}
                  className="text-sm text-theme-primary hover:text-theme-primary/80 transition-colors duration-200"
                  disabled={loading}
                >
                  Отправить письмо повторно
                </button>
              </div>
              
              {/* Информация о возможных проблемах */}
              <div className="text-xs text-theme-text-secondary bg-theme-background-secondary p-3 rounded-xl border border-theme-border/20">
                <div className="font-medium text-theme-text mb-2">Если письмо не приходит:</div>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-theme-text-secondary mt-1.5 flex-shrink-0" />
                    Проверьте папку "Спам" или "Промоакции"
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-theme-text-secondary mt-1.5 flex-shrink-0" />
                    Убедитесь, что email введен правильно
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-theme-text-secondary mt-1.5 flex-shrink-0" />
                    Письмо может идти до 10 минут
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-theme-text-secondary mt-1.5 flex-shrink-0" />
                    Попробуйте войти через Google
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Разделитель */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-theme-border/30"></div>
          <span className="px-3 text-xs text-theme-text-secondary font-medium">или</span>
          <div className="flex-1 border-t border-theme-border/30"></div>
        </div>

        {/* Кнопка Google (монохром) */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 border-2 border-theme-border text-theme-text rounded-xl 
                   hover:bg-theme-background-secondary disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 font-medium text-sm flex items-center justify-center gap-3 leading-none"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0 block align-middle">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-2.7.75 4.8 4.8 0 0 1-4.52-3.29H1.83v2.07A8 8 0 0 0 8.98 17z" />
            <path fill="#FBBC05" d="M4.46 10.48A4.8 4.8 0 0 1 4.21 9a4.8 4.8 0 0 1 .25-1.48V5.45H1.83A8 8 0 0 0 .98 9a8 8 0 0 0 .85 3.55l2.63-2.07z" />
            <path fill="#EA4335" d="M8.98 4.75c1.23 0 2.33.42 3.2 1.25l2.4-2.4A8 8 0 0 0 8.98 1a8 8 0 0 0-7.15 4.45l2.63 2.07A4.8 4.8 0 0 1 8.98 4.75z" />
          </svg>
          Войти через Google
        </button>

        {/* Информация о безопасности */}
        <p className="text-xs text-theme-text-secondary mt-4 text-center leading-relaxed pb-4">
          Ваши данные защищены и не передаются третьим лицам
        </p>
      </div>
    </div>
  );
}; 