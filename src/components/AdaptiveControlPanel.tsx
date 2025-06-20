import React, { useState, useRef } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { UserProfile } from './UserProfile';
import { Portal } from './Portal';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import { useAuth } from '../hooks/useAuth';
// import { clearAllUserData, checkUserDataState } from '../utils/dataCleanup';
import { ThemeMode, ActualTheme } from '../hooks/useTheme';

interface AdaptiveControlPanelProps {
  // Пропсы для темы
  themeMode: ThemeMode;
  systemTheme: ActualTheme;
  onSetTheme: (mode: ThemeMode) => void;
  supportsAutoTheme: boolean;
  
  // Пропсы для профиля
  onAuthModalOpen: () => void;
  
  // Состояние адаптивности
  isMobile: boolean;
  isDesktopWide: boolean;
}

export const AdaptiveControlPanel: React.FC<AdaptiveControlPanelProps> = ({
  themeMode,
  systemTheme,
  onSetTheme,
  supportsAutoTheme,
  onAuthModalOpen,
  isMobile,
  isDesktopWide
}) => {
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);
  // Состояния для управления данными - закомментированы
  // const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
  // const [dataState, setDataState] = useState<any>(null);
  // const [isClearing, setIsClearing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownPosition = useDropdownPosition(triggerRef, isBurgerOpen);
  const { user, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsBurgerOpen(false);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  const handleSignIn = () => {
    onAuthModalOpen();
    setIsBurgerOpen(false);
  };

  // Функция для получения иконки темы
  const getThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'auto':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'light':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Функции управления данными - закомментированы
  /*
  const handleDataManagementClick = () => {
    setIsDataManagementOpen(true);
    setIsBurgerOpen(false);
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
  */

  // Мобильная версия - переключатель темы и аватарка в одном контейнере
  if (isMobile) {
    return (
      <div className="flex items-center gap-3">
        <ThemeToggle 
          themeMode={themeMode}
          systemTheme={systemTheme}
          onSetTheme={onSetTheme}
          isMobile={true}
          supportsAutoTheme={supportsAutoTheme}
        />
        <UserProfile onSignInClick={onAuthModalOpen} />
      </div>
    );
  }

  // Десктоп с шириной < 1600px - компактное бургер меню
  if (!isDesktopWide) {
    return (
      <>
        <div className="relative">
          {/* Кнопка бургер меню */}
          <button
            ref={triggerRef}
            onClick={() => setIsBurgerOpen(!isBurgerOpen)}
            className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-theme-hover rounded-lg transition-colors"
            aria-label="Меню настроек"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Компактное выпадающее меню */}
          {isBurgerOpen && dropdownPosition && (
            <Portal>
              {/* Прозрачный overlay для закрытия при клике вне */}
              <div 
                className="fixed inset-0 z-[9998] bg-transparent pointer-events-auto" 
                onClick={() => setIsBurgerOpen(false)}
              />
              
              {/* Компактное выпадающее меню */}
              <div 
                className="absolute border border-gray-200 dark:border-gray-700 shadow-xl z-[9999] overflow-hidden rounded-xl"
                style={{
                  top: dropdownPosition.top,
                  right: dropdownPosition.right,
                  backgroundColor: 'var(--color-card-background)',
                  minWidth: 'auto'
                }}
              >
                {/* Компактная строка с элементами управления */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Быстрые кнопки переключения темы */}
                  <div className="flex items-center gap-1">
                    {supportsAutoTheme && (
                      <button
                        onClick={() => onSetTheme('auto')}
                        className={`p-2 rounded-lg transition-colors ${
                          themeMode === 'auto' 
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={`Авто (${systemTheme === 'dark' ? 'тёмная' : 'светлая'})`}
                      >
                        {getThemeIcon('auto')}
                      </button>
                    )}
                    
                    <button
                      onClick={() => onSetTheme('light')}
                      className={`p-2 rounded-lg transition-colors ${
                        themeMode === 'light' 
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title="Светлая тема"
                    >
                      {getThemeIcon('light')}
                    </button>
                    
                    <button
                      onClick={() => onSetTheme('dark')}
                      className={`p-2 rounded-lg transition-colors ${
                        themeMode === 'dark' 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title="Тёмная тема"
                    >
                      {getThemeIcon('dark')}
                    </button>
                  </div>
                  
                  {/* Разделитель */}
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                  
                  {/* Интегрированный профиль пользователя */}
                  <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                      <>
                        {/* Аватар пользователя */}
                        <div className="flex items-center gap-2">
                          {user?.user_metadata?.avatar_url ? (
                            <img
                              src={user.user_metadata.avatar_url}
                              alt="Аватар"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Кнопка управления данными - закомментирована
                        {user?.id && (
                          <button
                            onClick={handleDataManagementClick}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Управление данными"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        )}
                        */}
                        
                        {/* Кнопка выхода */}
                        <button
                          onClick={handleSignOut}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Выйти"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      /* Компактная кнопка входа - монохромный дизайн */
                      <button
                        onClick={handleSignIn}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 border border-gray-900 dark:border-gray-100"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Войти
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Portal>
          )}
        </div>

        {/* Модальное окно управления данными - закомментировано
        {isDataManagementOpen && (
          <Portal>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
              <div 
                className="rounded-xl shadow-xl w-full max-w-md p-6 mx-auto"
                style={{ backgroundColor: 'var(--color-card-background)' }}
              >
                <h3 className="text-lg font-semibold text-black dark:text-theme-secondary mb-4">Управление данными</h3>
                
                <div className="space-y-4">
                  <button
                    onClick={handleCheckDataState}
                    className="w-full px-4 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">Проверить состояние данных</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Посмотреть статистику ваших данных</div>
                  </button>
                  
                  <button
                    onClick={handleClearAllData}
                    disabled={isClearing}
                    className="w-full px-4 py-2 text-left border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-red-600 dark:text-red-400">
                      {isClearing ? 'Очистка...' : 'Очистить все данные'}
                    </div>
                    <div className="text-sm text-red-500 dark:text-red-400">⚠️ Необратимое действие</div>
                  </button>
                </div>
                
                {dataState && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm">
                      <div>Товаров: {dataState.itemsCount}</div>
                      <div>Категорий: {dataState.categoriesCount}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setIsDataManagementOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}
        */}
      </>
    );
  }

  // Широкий десктоп (>= 1600px) - обычная панель справа
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle 
        themeMode={themeMode}
        systemTheme={systemTheme}
        onSetTheme={onSetTheme}
        isMobile={false}
        supportsAutoTheme={supportsAutoTheme}
      />
      <UserProfile onSignInClick={onAuthModalOpen} />
    </div>
  );
}; 