import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Portal } from './Portal';
import { useIsMobile } from '../hooks/useIsMobile';
import { clearAllUserData, checkUserDataState } from '../utils/dataCleanup';

interface UserProfileProps {
  onSignInClick: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onSignInClick }) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
  const [dataState, setDataState] = useState<any>(null);
  const [isClearing, setIsClearing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Закрытие дропдауна при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  const handleCheckDataState = async () => {
    if (!user?.id) return;
    
    const state = await checkUserDataState(user.id);
    setDataState(state);
  };

  const handleClearAllData = async () => {
    if (!user?.id) return;
    
    const confirmed = window.confirm(
      '⚠️ ВНИМАНИЕ! Это действие полностью удалит все ваши данные (список желаний и категории) из всех устройств и из облака.\n\nЭто действие нельзя отменить!\n\nВы уверены?'
    );
    
    if (!confirmed) return;
    
    setIsClearing(true);
    try {
      const success = await clearAllUserData(user.id);
      if (success) {
        alert('✅ Все данные успешно очищены! Теперь вы можете начать заново.');
        setDataState(null);
        setIsDataManagementOpen(false);
      } else {
        alert('❌ Произошла ошибка при очистке данных. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка очистки данных:', error);
      alert('❌ Произошла ошибка при очистке данных.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDataManagementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDataManagementOpen(true);
    setIsDropdownOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={onSignInClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Войти
      </button>
    );
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-theme-hover transition-colors"
          title={user?.email || 'Профиль пользователя'}
        >
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Аватар"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          {!isMobile && (
            <span className="text-theme-primary text-sm max-w-32 truncate">
              {user?.email}
            </span>
          )}
          <svg 
            className={`w-4 h-4 text-theme-secondary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <>
            {isMobile ? (
              // Для мобильных используем Portal
              <Portal>
                <div className="fixed inset-0 z-[9999]">
                  <div className="absolute inset-0" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute left-1/2 top-20 transform -translate-x-1/2 bg-theme-card border border-theme-border rounded-lg shadow-lg py-2 min-w-64 z-[10000]">
                    <div className="px-4 py-2 border-b border-theme-border">
                      <div className="text-sm font-medium text-theme-primary truncate">
                        {user?.email}
                      </div>
                      <div className="text-xs text-theme-secondary">
                        {user?.user_metadata?.full_name || 'Пользователь'}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleDataManagementClick}
                      className="w-full px-4 py-2 text-left text-sm text-theme-primary hover:bg-theme-hover transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Управление данными
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Выйти
                    </button>
                  </div>
                </div>
              </Portal>
            ) : (
              // Для десктопа обычное позиционирование без Portal
              <div className="absolute right-0 top-full mt-2 bg-theme-card border border-theme-border rounded-lg shadow-lg py-2 min-w-64 z-50">
                <div className="px-4 py-2 border-b border-theme-border">
                  <div className="text-sm font-medium text-theme-primary truncate">
                    {user?.email}
                  </div>
                  <div className="text-xs text-theme-secondary">
                    {user?.user_metadata?.full_name || 'Пользователь'}
                  </div>
                </div>
                
                <button
                  onClick={handleDataManagementClick}
                  className="w-full px-4 py-2 text-left text-sm text-theme-primary hover:bg-theme-hover transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Управление данными
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Выйти
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно управления данными */}
      {isDataManagementOpen && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
            <div className="bg-theme-card rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-theme-primary">Управление данными</h3>
                <button
                  onClick={() => setIsDataManagementOpen(false)}
                  className="text-theme-secondary hover:text-theme-primary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <button
                    onClick={handleCheckDataState}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Проверить состояние данных
                  </button>
                  
                  {dataState && (
                    <div className="mt-3 p-3 bg-theme-hover rounded-lg text-sm">
                      <div className="font-medium text-theme-primary mb-2">Состояние данных:</div>
                      <div className="space-y-1 text-theme-secondary">
                        <div>📊 В облаке: {dataState.supabase.wishlistCount} товаров, {dataState.supabase.categoriesCount} категорий</div>
                        <div>💾 Локально: {dataState.localStorage.wishlistCount} товаров, {dataState.localStorage.categoriesCount} категорий</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-theme-border pt-4">
                  <div className="mb-3">
                    <div className="text-sm font-medium text-theme-primary mb-1">Полная очистка данных</div>
                    <div className="text-xs text-theme-secondary">
                      Удалит все ваши данные из облака и с всех устройств. Используйте для решения проблем с синхронизацией.
                    </div>
                  </div>
                  
                  <button
                    onClick={handleClearAllData}
                    disabled={isClearing}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                  >
                    {isClearing ? 'Очистка...' : '🗑️ Очистить все данные'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}; 