import { WishlistItem } from '../types/wishlistItem';

/**
 * Массив с примерными данными элементов вишлиста
 */
export const mockWishlistItems: WishlistItem[] = [
  {
    id: '1',
    itemType: 'Электроника',
    name: 'Смартфон Samsung Galaxy S21',
    link: 'https://example.com/samsung-galaxy-s21',
    price: 69990,
    currency: 'RUB',
    isBought: false
  },
  {
    id: '2',
    itemType: 'Книги',
    name: 'Мастер и Маргарита',
    link: 'https://example.com/master-i-margarita',
    price: 650,
    currency: 'RUB',
    isBought: true
  },
  {
    id: '3',
    itemType: 'Одежда',
    name: 'Зимняя куртка',
    link: 'https://example.com/winter-jacket',
    price: 8500,
    currency: 'RUB',
    isBought: false
  },
  {
    id: '4',
    itemType: 'Подарки',
    name: 'Набор косметики',
    link: '',
    price: 3200,
    currency: 'RUB',
    isBought: false
  }
];