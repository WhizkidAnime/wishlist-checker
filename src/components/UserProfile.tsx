import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabaseClient';
import { Portal } from './Portal';
import { useIsMobile } from '../hooks/useIsMobile';

interface UserProfileProps {
  onSignInClick: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onSignInClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showClearSuccessNotification, setShowClearSuccessNotification] = useState(false);
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Закрытие выпадающего меню при клике вне или нажатии Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && dropdownRef.current && triggerRef.current) {
        // Проверяем, что клик не был по кнопке триггера или внутри выпадающего меню
        if (!triggerRef.current.contains(event.target as Node) && 
            !dropdownRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showDropdown]);

  const handleSignOut = async () => {
    console.log('🔘 UserProfile: Нажата кнопка выхода');
    console.log('🔐 UserProfile: Текущий пользователь:', user?.email);
    
    try {
      console.log('🔄 UserProfile: Начинаем выход...');
      await signOut();
      console.log('✅ UserProfile: Выход выполнен успешно');
      setShowDropdown(false);
    } catch (error) {
      console.error('❌ UserProfile: Ошибка выхода:', error);
    }
  };

  // ЭКСТРЕННАЯ ОЧИСТКА АККАУНТА - удаляет ВСЕ данные пользователя
  const performFullAccountClear = async () => {
    if (!user?.id) {
      console.error('❌ Нет пользователя');
      return;
    }

    console.log('🚨 ЭКСТРЕННАЯ ОЧИСТКА АККАУНТА:', user.email);
    
    try {
      // Удаляем ВСЕ данные пользователя из Supabase
      const promises = [
        supabase!.from('wishlist_items').delete().eq('user_id', user.id),
        supabase!.from('user_categories').delete().eq('user_id', user.id),
        supabase!.from('user_preferences').delete().eq('user_id', user.id)
      ];

      const results = await Promise.allSettled(promises);
      
      // Логируем результаты
      results.forEach((result, index) => {
        const tables = ['wishlist_items', 'user_categories', 'user_preferences'];
        if (result.status === 'fulfilled') {
          console.log(`✅ Удалены данные из ${tables[index]}`);
        } else {
          console.error(`❌ Ошибка удаления из ${tables[index]}:`, result.reason);
        }
      });

      // Очищаем localStorage
      localStorage.removeItem('wishlistApp');
      localStorage.removeItem('wishlistCategories');
      localStorage.removeItem('wishlist-theme-mode');
      localStorage.removeItem('wishlist-last-modified');
      localStorage.removeItem('wishlist-data-hash');
      
      console.log('🧹 Очищен localStorage');

      // Диспатчим события обновления
      window.dispatchEvent(new CustomEvent('wishlistDataUpdated'));
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
      
      console.log('✅ АККАУНТ ПОЛНОСТЬЮ ОЧИЩЕН');
      
      setShowClearConfirmModal(false);
      setShowClearSuccessNotification(true);

    } catch (error) {
      console.error('❌ Ошибка очистки аккаунта:', error);
      setShowClearConfirmModal(false);
      // TODO: Показать кастомное уведомление об ошибке
    }
  };

  const handleAccountResetClick = () => {
    setShowDropdown(false);
    setShowClearConfirmModal(true);
  };

  // Автоматическое скрытие уведомления об успехе
  useEffect(() => {
    if (showClearSuccessNotification) {
      const timer = setTimeout(() => {
        setShowClearSuccessNotification(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showClearSuccessNotification]);

  const getDisplayName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Пользователь';
  };

  const getInitials = () => {
    const name = getDisplayName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Функция рендеринга содержимого выпадающего меню
  const renderDropdownContent = () => (
    <>
      {/* Информация о пользователе */}
      <div className="px-4 py-3 border-b border-theme-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-theme-primary text-white rounded-full flex items-center justify-center">
            {user?.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-theme-text truncate">
              {getDisplayName()}
            </div>
            <div className="text-sm text-theme-text-secondary truncate">
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Действия */}
      <div className="py-2">
        {/* Кнопка очистки аккаунта */}
        <button
          onClick={handleAccountResetClick}
          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400
                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                   flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          Очистить аккаунт
        </button>
        
        {/* Разделитель */}
        <div className="my-2 border-t border-theme-border"></div>
        
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-2 text-sm text-theme-text 
                   hover:bg-theme-background-secondary transition-colors
                   flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Выйти
        </button>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="w-8 h-8 bg-theme-background-secondary rounded-full animate-pulse"></div>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={onSignInClick}
        className="flex items-center gap-2 px-3 py-1.5 text-sm 
                 bg-white dark:bg-gray-800 
                 text-black dark:text-theme-text-secondary
                 border border-gray-300 dark:border-gray-600
                 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                 transition-colors duration-200"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10,17 15,12 10,7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        <span className="hidden sm:inline">Войти</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-theme-background-secondary 
                 transition-colors focus:outline-none"
      >
        {/* Аватар */}
        <div className="w-8 h-8 bg-theme-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
          {user?.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials()
          )}
        </div>
        
        {/* Имя пользователя (скрыто на мобильных) */}
        <span className="hidden sm:block text-sm text-theme-text max-w-32 truncate">
          {getDisplayName()}
        </span>
        
        {/* Стрелочка */}
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`hidden sm:block text-theme-text-secondary transition-transform ${showDropdown ? 'rotate-180' : ''}`}
        >
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>

      {/* Выпадающее меню */}
      {showDropdown && (
        <>
          {/* Условный рендеринг: Portal для мобильных, обычное позиционирование для десктопа */}
          {isMobile ? (
            <Portal>
              {/* Overlay для мобильной версии - прозрачный, только для закрытия */}
              <div 
                className="fixed inset-0 z-[9998]" 
                onClick={() => setShowDropdown(false)}
              />
              <div 
                ref={dropdownRef}
                className="fixed inset-x-4 top-20 bg-theme-card border border-theme-border 
                           rounded-2xl shadow-lg z-[9999] py-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Содержимое меню */}
                {renderDropdownContent()}
              </div>
            </Portal>
          ) : (
            <>
              {/* Overlay для десктопной версии */}
              <div 
                className="fixed inset-0 z-[9998]" 
                onClick={() => setShowDropdown(false)}
              />
              <div 
                ref={dropdownRef}
                className="absolute w-64 bg-theme-card border border-theme-border 
                           rounded-2xl shadow-lg z-[9999] py-2 mt-2"
                style={{
                  top: '100%',
                  right: 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Содержимое меню */}
                {renderDropdownContent()}
              </div>
            </>
          )}
        </>
      )}

      {/* Модальное окно подтверждения очистки аккаунта */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Очистить аккаунт?
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <p className="font-semibold text-red-600 dark:text-red-400">Это действие НЕОБРАТИМО!</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Все товары из вишлиста будут удалены.</li>
                <li>Все созданные категории будут удалены.</li>
                <li>Настройки темы будут сброшены.</li>
                <li>Данные из облака (если есть) и локального хранилища будут стерты.</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors duration-150 ease-in-out"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={performFullAccountClear}
                className="px-5 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-gray-800 transition-colors duration-150 ease-in-out"
              >
                Удалить всё
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Уведомление об успешной очистке */}
      {showClearSuccessNotification && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 mx-auto text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Аккаунт успешно очищен!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Все ваши данные были удалены.
            </p>
            <button
              type="button"
              onClick={() => setShowClearSuccessNotification(false)}
              className="w-full px-5 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 focus:outline-none transition-colors duration-150 ease-in-out"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

    </div>
  );
}; 