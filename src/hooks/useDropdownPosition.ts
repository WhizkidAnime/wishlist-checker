import { useEffect, useState, RefObject } from 'react';

interface Position {
  top: number;
  left: number;
  right?: number;
}

/**
 * Хук для вычисления позиции выпадающего элемента относительно кнопки-триггера
 * Используется с Portal для правильного позиционирования поверх всего контента
 */
export const useDropdownPosition = (
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  offset: number = 8
): Position | null => {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      setPosition({
        top: rect.bottom + scrollTop + offset,
        left: rect.left + scrollLeft,
        right: window.innerWidth - (rect.right + scrollLeft)
      });
    };

    updatePosition();

    // Обновляем позицию при скролле или изменении размера окна
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, triggerRef, offset]);

  return position;
}; 