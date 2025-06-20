import React, { useEffect } from 'react';
import { AuthForm } from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Блокируем скролл фона
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Закрытие по клику на оверлей (только при mousedown И mouseup на том же элементе)
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Проверяем что клик именно по оверлею, а не по дочерним элементам
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Предотвращаем закрытие при drag events (выделение текста)
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    // Если mousedown не на самом оверлее, не обрабатываем
    if (e.target !== e.currentTarget) {
      e.stopPropagation();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={handleOverlayClick}
      onMouseDown={handleOverlayMouseDown}
    >
      {/* Темный оверлей с анимацией */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
      
      {/* Контейнер модального окна */}
      <div className="relative w-full max-w-md transform transition-all duration-300 ease-out">
        {/* Основная карточка */}
        <div 
          className="bg-theme-card rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <AuthForm onClose={onClose} onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}; 