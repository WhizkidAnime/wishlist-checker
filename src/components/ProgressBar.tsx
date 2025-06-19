import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ProgressBarProps {
  totalUnbought: number;
  totalBought: number;
  currency: string;
  isMobile?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalUnbought,
  totalBought,
  currency,
  isMobile = false
}) => {
  const prevProgressRef = useRef<number>(0);
  const confettiTriggeredRef = useRef<boolean>(false);
  
  const totalSum = totalUnbought + totalBought;
  const progressPercentage = totalSum > 0 ? (totalBought / totalSum) * 100 : 0;
  
  // Определяем цвет прогресс-бара в зависимости от процента
  const getProgressColor = (percentage: number) => {
    if (percentage < 30) {
      return 'bg-gradient-to-r from-red-500 to-red-400';
    } else if (percentage < 70) {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    } else {
      return 'bg-gradient-to-r from-green-500 to-green-400';
    }
  };

  // Эффект конфетти при достижении 100%
  useEffect(() => {
    const currentProgress = Math.round(progressPercentage);
    
    // Запускаем конфетти только если прогресс достиг 100% и это первый раз
    if (currentProgress >= 100 && prevProgressRef.current < 100 && !confettiTriggeredRef.current) {
      confettiTriggeredRef.current = true;
      
      // Запускаем несколько залпов конфетти
      const fireConfetti = () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      };
      
      fireConfetti();
      setTimeout(fireConfetti, 200);
      setTimeout(fireConfetti, 400);
    }
    
    // Сбрасываем флаг если прогресс упал ниже 100%
    if (currentProgress < 100) {
      confettiTriggeredRef.current = false;
    }
    
    prevProgressRef.current = currentProgress;
  }, [progressPercentage]);

  if (totalSum === 0) {
    return null;
  }

  return (
    <div className="mt-6 sm:mt-8 border-t border-gray-200 dark:border-gray-600 pt-4 sm:pt-6">
      <div className="w-full">
        {/* Прогресс-бар */}
        <div className="relative">
          {/* Фоновая полоса */}
          <div className={`w-full ${isMobile ? 'h-2' : 'h-3'} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
            {/* Заполненная часть */}
            <div
              className={`${isMobile ? 'h-2' : 'h-3'} ${getProgressColor(progressPercentage)} rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Подписи снизу */}
        <div className="relative flex justify-between items-center mt-2 sm:mt-3">
          <div className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-600 dark:text-gray-400`}>
            {totalBought.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency} / {totalUnbought.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}
          </div>
          <div className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-600 dark:text-gray-400 absolute left-1/2 transform -translate-x-1/2`}>
            {Math.round(progressPercentage)}%
          </div>
          <div className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-600 dark:text-gray-400`}>
            {totalSum.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}
          </div>
        </div>
      </div>
    </div>
  );
}; 