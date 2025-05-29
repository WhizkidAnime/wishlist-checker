import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface UserProfileProps {
  onSignInClick: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onSignInClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, isAuthenticated, signOut, loading, isSupabaseAvailable } = useAuth();

  // Если Supabase недоступен, не показываем профиль
  if (!isSupabaseAvailable) {
    return null;
  }

  const handleSignOut = async () => {
    console.log('🔘 UserProfile: Нажата кнопка выхода');
    console.log('🔐 UserProfile: Текущий пользователь:', user?.email);
    console.log('🔧 UserProfile: isSupabaseAvailable:', isSupabaseAvailable);
    
    try {
      console.log('🔄 UserProfile: Начинаем выход...');
      await signOut();
      console.log('✅ UserProfile: Выход выполнен успешно');
      setShowDropdown(false);
    } catch (error) {
      console.error('❌ UserProfile: Ошибка выхода:', error);
    }
  };

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
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-theme-background-secondary 
                 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary"
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
          {/* Overlay для закрытия при клике вне */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          <div className="absolute right-0 top-full mt-2 w-64 bg-theme-card border border-theme-border 
                         rounded-lg shadow-lg z-20 py-2">
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
            <div className="pt-2">
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
          </div>
        </>
      )}
    </div>
  );
}; 