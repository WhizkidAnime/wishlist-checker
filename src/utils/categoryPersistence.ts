import { get, set, del } from 'idb-keyval';

// Константы
const CATEGORY_TIMEOUT = 5 * 60 * 1000; // 5 минут в миллисекундах
const STORAGE_KEY = 'wishlist-last-active-category';

// Интерфейс для данных в IndexedDB
interface CategoryData {
  category: string;
  timestamp: number;
}

/**
 * Сохраняет активную категорию с текущим timestamp в IndexedDB.
 * Эта функция только сохраняет, не принимая решения об очистке для 'all'.
 */
export const persistActiveCategoryToDB = async (category: string): Promise<void> => {
  // Категория 'all' не должна сохраняться как активная персистентная категория.
  // Логика очистки для 'all' должна быть в вызывающем коде (useCategories).
  if (category === 'all') {
    // Вместо сохранения 'all', мы должны очистить существующее значение.
    // Это предотвратит сохранение 'all' как таковой.
    await clearActiveCategoryFromDB();
    return;
  }

  try {
    const data: CategoryData = {
      category,
      timestamp: Date.now()
    };
    await set(STORAGE_KEY, data);
  } catch (error) {
    console.warn('[IndexedDB] Не удалось сохранить активную категорию:', error);
  }
};

/**
 * Возвращает последнюю активную категорию из IndexedDB, если она валидна по времени.
 * Очищает устаревшую запись.
 */
export const getLastActiveCategoryFromDB = async (): Promise<string | null> => {
  try {
    const storedData: CategoryData | undefined = await get(STORAGE_KEY);
    if (!storedData) {
      return null;
    }

    const now = Date.now();
    const timePassed = now - storedData.timestamp;

    if (timePassed > CATEGORY_TIMEOUT) {
      await clearActiveCategoryFromDB(); // Очищаем устаревшую запись
      return null;
    }

    return storedData.category;
  } catch (error) {
    console.warn('[IndexedDB] Ошибка при чтении сохраненной категории:', error);
    await clearActiveCategoryFromDB(); // Очищаем в случае ошибки чтения
    return null;
  }
};

/**
 * Очищает сохраненную активную категорию из IndexedDB.
 */
export const clearActiveCategoryFromDB = async (): Promise<void> => {
  try {
    await del(STORAGE_KEY);
  } catch (error) {
    console.warn('[IndexedDB] Не удалось очистить сохраненную категорию:', error);
  }
}; 