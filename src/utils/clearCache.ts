/**
 * Утилита для полной очистки кэша и удаления старых Service Workers
 * Используйте эту функцию при проблемах с кэшированием старых версий
 */
export const clearAllCache = async (): Promise<void> => {
  console.log('🧹 Начинаю полную очистку кэша...');
  
  try {
    // 1. Отменяем регистрацию всех Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        console.log('🗑️ Удаляю Service Worker:', registration.scope);
        await registration.unregister();
      }
      
      if (registrations.length > 0) {
        console.log(`✅ Удалено ${registrations.length} Service Worker(s)`);
      }
    }
    
    // 2. Очищаем все кэши
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        console.log('🗑️ Удаляю кэш:', cacheName);
        await caches.delete(cacheName);
      }
      
      if (cacheNames.length > 0) {
        console.log(`✅ Удалено ${cacheNames.length} кэш(ей)`);
      }
    }
    
    // 3. Очищаем localStorage (опционально, с предупреждением)
    const shouldClearStorage = confirm(
      'Также очистить локальные данные? Это удалит ваш список покупок и настройки.'
    );
    
    if (shouldClearStorage) {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Локальные данные очищены');
    }
    
    console.log('🎉 Полная очистка кэша завершена!');
    alert('Кэш успешно очищен! Рекомендуется перезагрузить страницу.');
    
  } catch (error) {
    console.error('❌ Ошибка при очистке кэша:', error);
    alert('Произошла ошибка при очистке кэша. Попробуйте перезагрузить страницу с очисткой кэша (Ctrl+Shift+R).');
  }
};

/**
 * Быстрая очистка только кэшей (без Service Worker и localStorage)
 */
export const clearOnlyCache = async (): Promise<void> => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`✅ Очищено ${cacheNames.length} кэш(ей)`);
    }
  } catch (error) {
    console.error('❌ Ошибка при очистке кэша:', error);
  }
};

/**
 * Проверка наличия активных Service Workers
 */
export const checkServiceWorkers = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`🔍 Найдено активных Service Workers: ${registrations.length}`);
    
    registrations.forEach((registration, index) => {
      console.log(`SW ${index + 1}:`, {
        scope: registration.scope,
        state: registration.active?.state,
        scriptURL: registration.active?.scriptURL
      });
    });
  }
}; 