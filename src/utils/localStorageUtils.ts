import { WishlistItem } from '../types/wishlistItem';

/**
 * Загружает данные из Local Storage по ключу.
 * Обрабатывает ошибки парсинга JSON.
 */
export function loadFromLocalStorage(key: string): WishlistItem[] | null {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return null; // Нет данных по ключу
    }
    return JSON.parse(serializedState) as WishlistItem[];
  } catch (error) {
    console.error(`Ошибка загрузки или парсинга данных из Local Storage (ключ: ${key}):`, error);
    // В случае ошибки можно вернуть null или пустой массив,
    // в зависимости от того, как это обрабатывается в приложении.
    // Вернем null, чтобы App.tsx мог использовать `|| []`.
    return null;
  }
}

/**
 * Сохраняет данные в Local Storage по ключу.
 * Обрабатывает ошибки сериализации JSON.
 */
export function saveToLocalStorage(key: string, state: WishlistItem[]): void {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.error(`Ошибка сохранения данных в Local Storage (ключ: ${key}):`, error);
  }
}