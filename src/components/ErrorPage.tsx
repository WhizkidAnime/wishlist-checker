import React, { useState, useEffect } from 'react';
import FuzzyText from './ui/FuzzyText';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';

interface ErrorPageProps {
  errorCode?: string | number;
  title?: string;
  description?: string;
  onReturnHome?: () => void;
  showReturnButton?: boolean;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  errorCode = '404',
  title = 'Страница не найдена',
  description = 'Запрашиваемая страница не существует или была перемещена',
  onReturnHome,
  showReturnButton = true
}) => {
  const { getThemeConfig } = useTheme();
  const { isMobile } = useResponsive();
  const themeConfig = getThemeConfig();
  
  const [hoverIntensity, setHoverIntensity] = useState(0.2);
  const [enableHover, setEnableHover] = useState(true);

  // Адаптируем интенсивность под размер экрана
  useEffect(() => {
    if (isMobile) {
      setHoverIntensity(0.3);
      setEnableHover(true); // Включаем тач-события на мобильных
    } else {
      setHoverIntensity(0.5);
      setEnableHover(true);
    }
  }, [isMobile]);

  const handleReturnHome = () => {
    if (onReturnHome) {
      onReturnHome();
    } else {
      // Fallback - перенаправляем на главную страницу
      window.location.href = '/wishlist-checker/';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center py-6 sm:py-12 px-4 ${themeConfig.background} transition-colors duration-200`}>
      {/* Основной контент */}
      <div className={`${themeConfig.cardBackground} rounded-3xl shadow-lg p-6 sm:p-8 lg:p-12 text-center max-w-2xl w-full mx-auto`}>
        
        {/* FuzzyText для кода ошибки */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <FuzzyText 
            baseIntensity={0.2} 
            hoverIntensity={hoverIntensity} 
            enableHover={enableHover}
            fontSize={isMobile ? "clamp(3rem, 15vw, 6rem)" : "clamp(4rem, 12vw, 8rem)"}
            fontWeight={900}
            compact={true}
          >
            {errorCode}
          </FuzzyText>
        </div>

        {/* Заголовок */}
        <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${themeConfig.text} mb-4 sm:mb-6 transition-colors duration-200`}>
          {title}
        </h1>

        {/* Описание */}
        <p className={`text-base sm:text-lg ${themeConfig.text} opacity-70 mb-6 sm:mb-8 leading-relaxed transition-colors duration-200`}>
          {description}
        </p>

        {/* Кнопка возврата */}
        {showReturnButton && (
          <button
            onClick={handleReturnHome}
            className={`
              inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 
              bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 
              rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 
              transition-all duration-200 font-medium text-base sm:text-lg
              shadow-lg hover:shadow-xl transform hover:scale-105
              border border-gray-900 dark:border-gray-100
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            `}
          >
            {/* Иконка дома */}
            <svg 
              className="w-5 h-5 sm:w-6 sm:h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            Вернуться на главную
          </button>
        )}

        {/* Дополнительная информация для мобильных */}
        {isMobile && (
          <div className={`mt-6 pt-6 border-t border-gray-200 dark:border-gray-700`}>
            <p className={`text-sm ${themeConfig.text} opacity-50`}>
              Коснитесь цифр выше, чтобы увидеть эффект
            </p>
          </div>
        )}
      </div>

      {/* Дополнительные элементы для десктопа */}
      {!isMobile && (
        <div className="mt-8 text-center">
          <p className={`text-sm ${themeConfig.text} opacity-40 transition-colors duration-200`}>
            Наведите курсор на цифры для интерактивного эффекта
          </p>
        </div>
      )}
    </div>
  );
}; 