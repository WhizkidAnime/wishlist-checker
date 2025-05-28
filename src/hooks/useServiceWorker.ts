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
      console.log('[SW] Регистрация Service Worker...');
      
      // Определяем правильный путь в зависимости от режима
      const isDev = import.meta.env.DEV;
      const swPath = isDev ? '/sw.js' : '/wishlist-checker/sw.js';
      const swScope = isDev ? '/' : '/wishlist-checker/';
      
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: swScope
      });

      console.log('[SW] Service Worker зарегистрирован успешно:', registration);

      setStatus(prev => ({
        ...prev,
        isRegistered: true,
        registration
      }));

      // Проверяем обновления при регистрации
      await checkForUpdates();

      // Слушаем события обновления
      registration.addEventListener('updatefound', () => {
        console.log('[SW] Найдено обновление Service Worker');
        
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Новая версия готова к установке');
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
        console.log('[SW] Применение обновления...');
        
        // Отправляем сообщение для принудительной активации
        waitingWorker.postMessage('SKIP_WAITING');
        
        // Ждем активации нового Service Worker
        waitingWorker.addEventListener('statechange', () => {
          if (waitingWorker.state === 'activated') {
            console.log('[SW] Обновление применено, перезагружаем страницу...');
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
      console.log('[SW] Проверка обновлений...');
      await status.registration.update();
    } catch (error) {
      console.error('[SW] Ошибка проверки обновлений:', error);
    }
  };

  // Обработка изменения состояния сети
  useEffect(() => {
    const handleOnline = () => {
      console.log('[SW] Соединение восстановлено');
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      console.log('[SW] Соединение потеряно - переход в offline режим');
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
      console.log('[SW] Получено сообщение:', event.data);
      
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