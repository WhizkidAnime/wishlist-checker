// Управление экраном загрузки и статусами без inline-скриптов

const STATUSES = [
  'Инициализация приложения',
  'Загрузка компонентов',
  'Подготовка интерфейса',
  'Проверка авторизации',
  'Загрузка данных',
  'Данные загружены'
];

export function attachLoaderHandlers(): void {
  const loadingText = document.getElementById('initial-loading-text');
  const loadingScreen = document.getElementById('initial-loading-screen');
  if (!loadingScreen || !loadingText) return;

  let statusIndex = 0;
  const startTime = Date.now();
  const MIN_LOADING_TIME = 1000; // 1s
  const MAX_LOADING_TIME = 10000; // 10s
  let isReactLoaded = false;
  let isDataLoaded = false;

  const updateStatus = () => {
    if (statusIndex < STATUSES.length - 1) {
      statusIndex++;
      loadingText.textContent = STATUSES[statusIndex];
    }
  };
  const statusInterval = window.setInterval(updateStatus, 400);

  const hideLoadingScreen = (reason: 'completed' | 'timeout') => {
    window.clearInterval(statusInterval);
    loadingText.textContent = reason === 'timeout' ? 'Загрузка завершена' : STATUSES[STATUSES.length - 1];
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
    window.setTimeout(() => {
      loadingScreen.classList.add('hidden');
      window.setTimeout(() => loadingScreen.remove(), 300);
    }, remainingTime + 200);
  };

  const checkFullyLoaded = () => {
    if (isReactLoaded && isDataLoaded) hideLoadingScreen('completed');
  };

  // Timeout принудительного скрытия
  window.setTimeout(() => {
    if (!isReactLoaded || !isDataLoaded) hideLoadingScreen('timeout');
  }, MAX_LOADING_TIME);

  // Событие от React-приложения
  window.addEventListener('appDataLoaded', () => {
    isDataLoaded = true;
    loadingText.textContent = 'Данные загружены';
    checkFullyLoaded();
  });

  // Детект рендера React по заполнению #root
  const checkReactLoaded = () => {
    const root = document.getElementById('root');
    if (root && root.children.length > 0) {
      isReactLoaded = true;
      loadingText.textContent = 'Загрузка данных';
      checkFullyLoaded();
    } else {
      window.setTimeout(checkReactLoaded, 100);
    }
  };
  window.setTimeout(checkReactLoaded, 500);
}


