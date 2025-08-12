import { useCallback, useRef, useEffect } from 'react';
import { isIOS } from '../utils/iosSupport';

interface LongPressOptions {
  delay?: number;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
  onLongPressCancel?: () => void;
}

export const useLongPress = (callback: () => void, options: LongPressOptions = {}) => {
  const {
    delay = 300,
    onLongPressStart,
    onLongPressEnd,
    onLongPressCancel
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);
  const startCoords = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (isLongPressing.current) {
      isLongPressing.current = false;
      onLongPressEnd?.();
    }
  }, [onLongPressEnd]);

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

    clear();
    
    timeoutRef.current = setTimeout(() => {
      isLongPressing.current = true;
      onLongPressStart?.();
      callback();
    }, delay);
  }, [callback, delay, clear, onLongPressStart]);

  const move = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!startCoords.current) return;

    let currentX: number, currentY: number;
    
    if ('touches' in event) {
      currentX = event.touches[0].clientX;
      currentY = event.touches[0].clientY;
    } else {
      currentX = event.clientX;
      currentY = event.clientY;
    }

    // Если палец сдвинулся больше чем на 10px - отменяем long press
    const deltaX = Math.abs(currentX - startCoords.current.x);
    const deltaY = Math.abs(currentY - startCoords.current.y);
    
    if (deltaX > 10 || deltaY > 10) {
      clear();
      onLongPressCancel?.();
    }
  }, [clear, onLongPressCancel]);

  const end = useCallback(() => {
    startCoords.current = null;
    clear();
  }, [clear]);

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
