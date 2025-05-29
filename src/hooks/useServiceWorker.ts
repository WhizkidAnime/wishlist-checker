import { useEffect, useState } from 'react';

interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

interface UseServiceWorkerReturn extends ServiceWorkerStatus {
  registerSW: () => Promise<void>;
  updateSW: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

export const useServiceWorker = (): UseServiceWorkerReturn => {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    registration: null,
    updateAvailable: false,
  });

  // Проверка поддержки Service Worker
  const isServiceWorkerSupported = () => {
    return 'serviceWorker' in navigator;
  };

  // Регистрация Service Worker
  const registerSW = async (): Promise<void> => {
    if (!isServiceWorkerSupported()) {
      console.warn('[SW] Service Worker не поддерживается этим браузером');
      return;
    }

    try {
      // Определяем правильный путь в зависимости от режима
      const isDev = import.meta.env.DEV;
      const swPath = isDev ? '/sw.js' : '/wishlist-checker/sw.js';
      const swScope = isDev ? '/' : '/wishlist-checker/';
      
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: swScope
      });

      setStatus(prev => ({
        ...prev,
        isRegistered: true,
        registration
      }));

      // Проверяем обновления при регистрации
      await checkForUpdates();

      // Слушаем события обновления
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setStatus(prev => ({
                ...prev,
                updateAvailable: true
              }));
            }
          });
        }
      });

    } catch (error) {
      console.error('[SW] Ошибка регистрации Service Worker:', error);
      setStatus(prev => ({
        ...prev,
        isRegistered: false
      }));
    }
  };

  // Обновление Service Worker
  const updateSW = async (): Promise<void> => {
    if (!status.registration) {
      console.warn('[SW] Service Worker не зарегистрирован');
      return;
    }

    try {
      const waitingWorker = status.registration.waiting;
      
      if (waitingWorker) {
        // Отправляем сообщение для принудительной активации
        waitingWorker.postMessage('SKIP_WAITING');
        
        // Ждем активации нового Service Worker
        waitingWorker.addEventListener('statechange', () => {
          if (waitingWorker.state === 'activated') {
            window.location.reload();
          }
        });

        setStatus(prev => ({
          ...prev,
          updateAvailable: false
        }));
      }
    } catch (error) {
      console.error('[SW] Ошибка обновления Service Worker:', error);
    }
  };

  // Проверка обновлений
  const checkForUpdates = async (): Promise<void> => {
    if (!status.registration) {
      return;
    }

    try {
      await status.registration.update();
    } catch (error) {
      console.error('[SW] Ошибка проверки обновлений:', error);
    }
  };

  // Обработка изменения состояния сети
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Автоматическая регистрация при монтировании
  useEffect(() => {
    // Временно отключаем Service Worker для разработки
    if (import.meta.env.DEV) {
      console.log('[SW] Service Worker отключен в режиме разработки');
      return;
    }
    
    if (isServiceWorkerSupported() && !status.isRegistered) {
      registerSW();
    }
  }, []);

  // Периодическая проверка обновлений (каждые 30 минут)
  useEffect(() => {
    if (!status.registration) return;

    const interval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000); // 30 минут

    return () => clearInterval(interval);
  }, [status.registration]);

  // Слушаем сообщения от Service Worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SW_UPDATE_AVAILABLE') {
        setStatus(prev => ({
          ...prev,
          updateAvailable: true
        }));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    ...status,
    registerSW,
    updateSW,
    checkForUpdates,
  };
}; 