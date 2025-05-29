/**
 * Утилита для условного логирования
 * Позволяет легко включать/выключать debug-сообщения
 */

const isDevelopment = import.meta.env.DEV;
const isDebugEnabled = isDevelopment && localStorage.getItem('debug-logs') === 'true';

export const logger = {
  // Обычные логи (всегда видны)
  info: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },

  // Логи ошибок (всегда видны)
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },

  // Предупреждения (всегда видны)
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },

  // Debug логи (только в dev режиме и при включенном флаге)
  debug: (message: string, ...args: any[]) => {
    if (isDebugEnabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  // Логи синхронизации (только в dev режиме)
  sync: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[SYNC] ${message}`, ...args);
    }
  },

  // Логи аутентификации (только в dev режиме) 
  auth: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[AUTH] ${message}`, ...args);
    }
  }
};

// Функции для управления debug-логами
export const enableDebugLogs = () => {
  localStorage.setItem('debug-logs', 'true');
  console.log('🔧 Debug логи включены. Перезагрузите страницу для применения.');
};

export const disableDebugLogs = () => {
  localStorage.removeItem('debug-logs');
  console.log('🔧 Debug логи отключены. Перезагрузите страницу для применения.');
};

// Добавляем функции в window для использования в консоли
if (isDevelopment) {
  (window as any).enableDebugLogs = enableDebugLogs;
  (window as any).disableDebugLogs = disableDebugLogs;
} 