import React from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, updateAvailable, updateSW } = useServiceWorker();

  return (
    <>
      {/* Индикатор offline/online статуса */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-2 px-4 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Режим offline - данные сохраняются локально
          </div>
        </div>
      )}

      {/* Уведомление об обновлении */}
      {updateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
          <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg 
                  className="w-5 h-5 text-blue-200" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold mb-1">
                  Доступно обновление
                </h4>
                <p className="text-sm text-blue-100 mb-3">
                  Новая версия приложения готова к установке
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={updateSW}
                    className="bg-white text-blue-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    Обновить
                  </button>
                  <button
                    onClick={() => {
                      // Можно добавить логику отложенного обновления
                      console.log('Обновление отложено');
                    }}
                    className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-400 transition-colors"
                  >
                    Позже
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Индикатор первоначальной установки PWA */}
      {isOnline && (
        <div className="hidden">
          {/* Этот блок может показывать статус кэширования при первом визите */}
          <div className="text-xs text-gray-500 text-center py-2">
            ✓ Приложение готово к работе offline
          </div>
        </div>
      )}
    </>
  );
}; 