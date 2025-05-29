import { ReactNode, useState, useRef, useEffect } from 'react';
import { Portal } from '../Portal';
// import { MobileTooltipModal } from './MobileTooltipModal';
import { useIsMobile } from '../../hooks/useIsMobile';

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number; // Задержка в миллисекундах перед показом
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  usePortal?: boolean; // Опция для использования Portal при проблемах с z-index
}

export const Tooltip = ({ 
  content, 
  children, 
  delay = 800, // По умолчанию 800ms задержка
  position = 'top',
  className = '',
  usePortal = false
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  // const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleMouseEnter = () => {
    if (isMobile) return; // На мобиле не показываем tooltip по hover
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setShouldShow(true);
    timeoutRef.current = setTimeout(() => {
      if (usePortal && triggerRef.current) {
        calculatePortalPosition();
      }
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setShouldShow(false);
    setIsVisible(false);
  };

  const handleClick = () => {
    // Убираем показ модального окна на мобильных устройствах
    // if (isMobile) {
    //   setMobileModalOpen(true);
    // }
  };

  const calculatePortalPosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = rect.top + scrollTop - 10; // 10px отступ для tooltip + стрелки
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollTop + 10;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - 10;
        break;
      case 'right':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + 10;
        break;
    }
    
    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (usePortal && shouldShow && triggerRef.current) {
      calculatePortalPosition();
      
      const handleScroll = () => {
        if (shouldShow) {
          calculatePortalPosition();
        }
      };
      
      const handleResize = () => {
        if (shouldShow) {
          calculatePortalPosition();
        }
      };
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [usePortal, shouldShow, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionClasses = () => {
    if (usePortal) {
      // Для Portal используем трансформации для центрирования
      switch (position) {
        case 'top':
          return 'transform -translate-x-1/2 -translate-y-full';
        case 'bottom':
          return 'transform -translate-x-1/2';
        case 'left':
          return 'transform -translate-x-full -translate-y-1/2';
        case 'right':
          return 'transform -translate-y-1/2';
        default:
          return 'transform -translate-x-1/2 -translate-y-full';
      }
    }
    
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800 dark:border-t-gray-200';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800 dark:border-b-gray-200';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800 dark:border-l-gray-200';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800 dark:border-r-gray-200';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800 dark:border-t-gray-200';
    }
  };

  const tooltipContent = shouldShow && !isMobile && (
    <div
      ref={tooltipRef}
      className={`${usePortal ? 'absolute' : 'absolute'} ${usePortal ? 'z-[9999]' : 'z-50'} px-3 py-2 text-sm text-white bg-gray-800 dark:bg-gray-200 dark:text-gray-800 rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200 ${getPositionClasses()} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={usePortal ? { 
        top: tooltipPosition.top, 
        left: tooltipPosition.left 
      } : undefined}
    >
      {content}
      
      {/* Стрелка */}
      <div
        className={`absolute border-4 ${getArrowClasses()}`}
      />
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
        
        {usePortal ? (
          shouldShow && !isMobile && <Portal>{tooltipContent}</Portal>
        ) : (
          tooltipContent
        )}
      </div>

      {/* Мобильное модальное окно - удалено */}
      {/* {isMobile && (
        <MobileTooltipModal
          isOpen={mobileModalOpen}
          onClose={handleCloseMobileModal}
          content={content}
          title={title}
        />
      )} */}
    </>
  );
}; 