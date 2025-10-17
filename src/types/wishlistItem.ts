/**
 * Тип данных для элемента вишлиста
 */
export interface WishlistItem {
  /** Уникальный идентификатор элемента */
  id: string | number;
  /** Тип товара (опционально) */
  itemType?: string;
  /** Название товара */
  name: string;
  /** URL-ссылка на товар (может быть пустой) */
  link: string;
  /** Цена товара в базовой валюте (рублях) */
  price: number;
  /** Валюта (по умолчанию RUB) */
  currency: string;
  /** Флаг, указывающий, куплен ли товар */
  isBought: boolean;
  /** Необязательный комментарий к товару */
  comment?: string;
  /** Категория товара */
  category?: string;
}

/**
 * Пример элемента вишлиста
 */
export const exampleWishlistItem: WishlistItem = {
  id: '1',
  itemType: 'Электроника',
  name: 'Смартфон Samsung Galaxy S21',
  link: 'https://example.com/samsung-galaxy-s21',
  price: 69990,
  currency: 'RUB',
  isBought: false,
  comment: 'Пример комментария'
};