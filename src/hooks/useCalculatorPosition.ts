import { useState, useEffect } from 'react';

export const useCalculatorPosition = () => {
  const [calculatorPosition, setCalculatorPosition] = useState<{ top: number, left: number } | null>(null);
  const [firstButtonRef, setFirstButtonRef] = useState<HTMLElement | null>(null);

  const updateCalculatorPosition = () => {
    if (!firstButtonRef) return;
    
    const mainContainer = document.querySelector('.w-full.max-w-4xl.bg-white.rounded-3xl') as HTMLElement;
    if (!mainContainer) return;
    
    const containerRect = mainContainer.getBoundingClientRect();
    const buttonRect = firstButtonRef.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const calculatorWidth = 320;
    let left = containerRect.left - calculatorWidth - 20;
    let top = buttonRect.top;
    
    if (left < 20) {
      left = containerRect.right + 20;
      if (left + calculatorWidth > windowWidth - 20) {
        left = 20;
        top = containerRect.top + 60;
      }
    }
    
    if (top + 200 > windowHeight) {
      top = windowHeight - 220;
    }
    
    if (top < 20) {
      top = 20;
    }
    
    setCalculatorPosition({ top, left });
  };

  useEffect(() => {
    if (firstButtonRef) {
      updateCalculatorPosition();
    }
  }, [firstButtonRef]);

  useEffect(() => {
    const handleScroll = () => {
      if (firstButtonRef) {
        updateCalculatorPosition();
      }
    };

    const handleResize = () => {
      if (firstButtonRef) {
        updateCalculatorPosition();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [firstButtonRef]);

  return {
    calculatorPosition,
    setCalculatorPosition,
    firstButtonRef,
    setFirstButtonRef,
    updateCalculatorPosition
  };
}; 