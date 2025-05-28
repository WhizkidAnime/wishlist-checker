import { useState, useEffect } from 'react';

export const useCalculatorPosition = () => {
  const [calculatorPosition, setCalculatorPosition] = useState<{ top: number, left: number, width: number } | null>(null);
  const [firstButtonRef, setFirstButtonRef] = useState<HTMLElement | null>(null);

  const updateCalculatorPosition = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isMobile = windowWidth < 768; // md breakpoint
    
    let calculatorWidth: number;
    let left: number;
    let top: number;
    
    if (isMobile) {
      // На мобиле: полная ширина экрана с отступами, всегда наверху
      calculatorWidth = windowWidth - 40; // отступы по 20px с каждой стороны
      left = 20;
      top = 20; // всегда наверху экрана
    } else {
      // На десктопе: фиксированная позиция посередине слева экрана
      calculatorWidth = 320;
      left = 20; // отступ от левого края
      top = windowHeight / 2 - 100; // посередине по вертикали (примерно, с учетом высоты калькулятора)
      
      // Проверяем границы
      if (top < 20) {
        top = 20;
      }
      if (top + 200 > windowHeight - 20) {
        top = windowHeight - 220;
      }
    }
    
    setCalculatorPosition({ top, left, width: calculatorWidth });
  };

  useEffect(() => {
    const handleResize = () => {
      if (calculatorPosition) {
        updateCalculatorPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculatorPosition]);

  // Функция для показа калькулятора (вызывается при первом выборе товара)
  const showCalculator = () => {
    updateCalculatorPosition();
  };

  // Функция для скрытия калькулятора (вызывается при нажатии на крестик)
  const hideCalculator = () => {
    setCalculatorPosition(null);
    setFirstButtonRef(null);
  };

  return {
    calculatorPosition,
    setCalculatorPosition,
    firstButtonRef,
    setFirstButtonRef,
    updateCalculatorPosition,
    showCalculator,
    hideCalculator
  };
}; 