/**
 * localStorage utilities - текущий активный модуль
 * 
 * В настоящее время использует заглушки для отключения localStorage
 * в пользу Supabase синхронизации.
 * 
 * Для восстановления localStorage:
 * 1. Измените импорт с './storageStubs' на './legacy/localStorageUtils'
 * 2. Или установите STORAGE_CONFIG.USE_LOCAL_STORAGE = true
 */

// Текущий активный импорт - заглушки (localStorage отключен)
export {
  loadFromLocalStorage,
  saveToLocalStorage,
  loadWishlistFromLocalStorage,
  saveWishlistToLocalStorage,
  clearAllAppData,
  removeDuplicatesFromWishlist
} from './storageStubs';

// Для восстановления localStorage замените строку выше на:
// export {
//   loadFromLocalStorage,
//   saveToLocalStorage,
//   loadWishlistFromLocalStorage,
//   saveWishlistToLocalStorage,
//   clearAllAppData,
//   removeDuplicatesFromWishlist
// } from './legacy/localStorageUtils'; 