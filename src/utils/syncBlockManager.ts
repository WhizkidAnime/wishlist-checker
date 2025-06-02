// Утилита для управления блокировкой синхронизации
class SyncBlockManager {
  private static instance: SyncBlockManager;
  private timeoutIds: Set<NodeJS.Timeout> = new Set();
  private blockCount = 0;

  private constructor() {}

  static getInstance(): SyncBlockManager {
    if (!SyncBlockManager.instance) {
      SyncBlockManager.instance = new SyncBlockManager();
    }
    return SyncBlockManager.instance;
  }

  // Блокировать синхронизацию с автоматическим снятием блокировки
  block(timeoutMs: number = 10000): () => void {
    this.blockCount++;
    (window as any).blockWishlistSync = true;

    // Создаем таймаут для автоматического снятия блокировки
    const timeoutId = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Принудительное снятие блокировки синхронизации (таймаут)');
      }
      this.forceUnblock();
    }, timeoutMs);

    this.timeoutIds.add(timeoutId);

    // Возвращаем функцию для ручного снятия блокировки
    return () => {
      this.unblock(timeoutId);
    };
  }

  // Снять блокировку вручную
  private unblock(timeoutId: NodeJS.Timeout) {
    if (this.timeoutIds.has(timeoutId)) {
      clearTimeout(timeoutId);
      this.timeoutIds.delete(timeoutId);
      this.blockCount = Math.max(0, this.blockCount - 1);

      // Снимаем блокировку только если больше нет активных блокировок
      if (this.blockCount === 0) {
        (window as any).blockWishlistSync = false;
      }
    }
  }

  // Принудительное снятие всех блокировок
  private forceUnblock() {
    // Очищаем все таймауты
    this.timeoutIds.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.timeoutIds.clear();
    this.blockCount = 0;
    (window as any).blockWishlistSync = false;
  }

  // Проверить, заблокирована ли синхронизация
  isBlocked(): boolean {
    return !!(window as any).blockWishlistSync;
  }

  // Очистить все при размонтировании компонентов
  cleanup() {
    this.forceUnblock();
  }
}

export const syncBlockManager = SyncBlockManager.getInstance(); 