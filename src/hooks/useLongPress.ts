import { useCallback, useRef, useEffect } from 'react';
import { isIOS } from '../utils/iosSupport';

interface LongPressDragOptions {
  delay?: number;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
  onLongPressCancel?: () => void;
  onDragStart?: (element: HTMLElement, startY: number) => void;
  onDragMove?: (element: HTMLElement, currentY: number, deltaY: number) => void;
  onDragEnd?: (element: HTMLElement, finalY: number) => void;
}

export const useLongPress = (callback: () => void, options: LongPressDragOptions = {}) => {
  const {
    delay = 250,
    onLongPressStart,
    onLongPressEnd,
    onLongPressCancel,
    onDragStart,
    onDragMove,
    onDragEnd
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);
  const isDragging = useRef(false);
  const startCoords = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (isLongPressing.current) {
      isLongPressing.current = false;
      onLongPressEnd?.();
    }
    if (isDragging.current) {
      isDragging.current = false;
      if (elementRef.current && startCoords.current) {
        onDragEnd?.(elementRef.current, startCoords.current.y);
      }
    }
  }, [onLongPressEnd, onDragEnd]);

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    // Записываем начальные координаты
    if ('touches' in event) {
      startCoords.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    } else {
      startCoords.current = {
        x: event.clientX,
        y: event.clientY
      };
    }

    elementRef.current = event.currentTarget as HTMLElement;
    clear();
    
    timeoutRef.current = setTimeout(() => {
      isLongPressing.current = true;
      onLongPressStart?.();
      callback();
      
      // После long-press активируем режим перетаскивания
      if (elementRef.current && startCoords.current) {
        isDragging.current = true;
        onDragStart?.(elementRef.current, startCoords.current.y);
      }
    }, delay);
  }, [callback, delay, clear, onLongPressStart, onDragStart]);

  const move = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!startCoords.current || !elementRef.current) return;

    let currentX: number, currentY: number;
    
    if ('touches' in event) {
      currentX = event.touches[0].clientX;
      currentY = event.touches[0].clientY;
    } else {
      currentX = event.clientX;
      currentY = event.clientY;
    }

    const deltaX = Math.abs(currentX - startCoords.current.x);
    const deltaY = Math.abs(currentY - startCoords.current.y);
    
    if (isDragging.current) {
      // В режиме перетаскивания - передаем координаты
      event.preventDefault();
      onDragMove?.(elementRef.current, currentY, currentY - startCoords.current.y);
    } else if (deltaX > 10 || deltaY > 10) {
      // Если long-press еще не сработал, но палец сдвинулся - отменяем
      clear();
      onLongPressCancel?.();
    }
  }, [clear, onLongPressCancel, onDragMove]);

  const end = useCallback(() => {
    if (isDragging.current && elementRef.current && startCoords.current) {
      onDragEnd?.(elementRef.current, startCoords.current.y);
    }
    
    startCoords.current = null;
    elementRef.current = null;
    isDragging.current = false;
    clear();
  }, [clear, onDragEnd]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  if (isIOS()) {
    return {
      onTouchStart: start,
      onTouchMove: move,
      onTouchEnd: end,
      onTouchCancel: end,
    };
  }

  return {
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onMouseLeave: end,
  };
};
