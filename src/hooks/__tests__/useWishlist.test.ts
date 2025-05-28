import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWishlist } from '../useWishlist'
import { WishlistItem } from '../../types/wishlistItem'

// Мок localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useWishlist', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('должен инициализироваться пустым списком', () => {
    const { result } = renderHook(() => useWishlist())
    
    expect(result.current.wishlist).toEqual([])
  })

  it('должен добавлять новый товар', () => {
    const { result } = renderHook(() => useWishlist())
    
    const newItem = {
      itemType: 'Электроника',
      name: 'Тестовый товар',
      link: 'https://test.com',
      price: 1000,
      currency: 'RUB',
      comment: 'Тест'
    }
    
    act(() => {
      result.current.handleAddItem(newItem)
    })
    
    expect(result.current.wishlist).toHaveLength(1)
    expect(result.current.wishlist[0]).toMatchObject({
      ...newItem,
      isBought: false
    })
    expect(result.current.wishlist[0].id).toBeDefined()
  })

  it('должен переключать статус покупки товара', () => {
    const { result } = renderHook(() => useWishlist())
    
    const newItem = {
      itemType: 'Электроника',
      name: 'Тестовый товар',
      link: '',
      price: 1000,
      currency: 'RUB'
    }
    
    act(() => {
      result.current.handleAddItem(newItem)
    })
    
    const itemId = result.current.wishlist[0].id
    
    act(() => {
      result.current.handleToggleBought(itemId)
    })
    
    expect(result.current.wishlist[0].isBought).toBe(true)
    
    act(() => {
      result.current.handleToggleBought(itemId)
    })
    
    expect(result.current.wishlist[0].isBought).toBe(false)
  })

  it('должен удалять товар', () => {
    const { result } = renderHook(() => useWishlist())
    
    const newItem = {
      itemType: 'Электроника',
      name: 'Тестовый товар',
      link: '',
      price: 1000,
      currency: 'RUB'
    }
    
    act(() => {
      result.current.handleAddItem(newItem)
    })
    
    expect(result.current.wishlist).toHaveLength(1)
    
    const itemId = result.current.wishlist[0].id
    
    act(() => {
      result.current.handleDeleteItem(itemId)
    })
    
    expect(result.current.wishlist).toHaveLength(0)
  })

  it('должен обновлять товар', () => {
    const { result } = renderHook(() => useWishlist())
    
    const newItem = {
      itemType: 'Электроника',
      name: 'Тестовый товар',
      link: '',
      price: 1000,
      currency: 'RUB'
    }
    
    act(() => {
      result.current.handleAddItem(newItem)
    })
    
    const itemToUpdate: WishlistItem = {
      ...result.current.wishlist[0],
      name: 'Обновленный товар',
      price: 2000
    }
    
    act(() => {
      result.current.handleUpdateItem(itemToUpdate)
    })
    
    expect(result.current.wishlist[0].name).toBe('Обновленный товар')
    expect(result.current.wishlist[0].price).toBe(2000)
  })

  it('должен правильно вычислять общие суммы', () => {
    const { result } = renderHook(() => useWishlist())
    
    const item1 = {
      itemType: 'Электроника',
      name: 'Товар 1',
      link: '',
      price: 1000,
      currency: 'RUB'
    }
    
    const item2 = {
      itemType: 'Книги',
      name: 'Товар 2',
      link: '',
      price: 500,
      currency: 'RUB'
    }
    
    act(() => {
      result.current.handleAddItem(item1)
    })
    
    act(() => {
      result.current.handleAddItem(item2)
    })
    
    // Проверяем общие суммы когда все товары непокупленные
    expect(result.current.totalUnbought).toBe(1500)
    expect(result.current.totalBought).toBe(0)
    
    // Покупаем один товар
    const firstItemId = result.current.wishlist[0].id
    act(() => {
      result.current.handleToggleBought(firstItemId)
    })
    
    // После покупки одного товара суммы должны измениться
    const newTotalUnbought = result.current.totalUnbought
    const newTotalBought = result.current.totalBought
    
    expect(newTotalUnbought + newTotalBought).toBe(1500) // общая сумма должна остаться той же
    expect(newTotalBought).toBeGreaterThan(0) // что-то должно быть куплено
    expect(newTotalUnbought).toBeLessThan(1500) // что-то должно остаться непокупленным
  })

  it('должен фильтровать товары по поисковому запросу', () => {
    const { result } = renderHook(() => useWishlist())
    
    const item1 = {
      itemType: 'Электроника',
      name: 'iPhone',
      link: '',
      price: 1000,
      currency: 'RUB'
    }
    
    const item2 = {
      itemType: 'Книги',
      name: 'Книга про React',
      link: '',
      price: 500,
      currency: 'RUB'
    }
    
    act(() => {
      result.current.handleAddItem(item1)
    })
    
    act(() => {
      result.current.handleAddItem(item2)
    })
    
    act(() => {
      result.current.setSearchQuery('iPhone')
    })
    
    expect(result.current.filteredAndSortedWishlist).toHaveLength(1)
    expect(result.current.filteredAndSortedWishlist[0].name).toBe('iPhone')
  })

  it('должен сортировать товары по цене', () => {
    const { result } = renderHook(() => useWishlist())
    
    const item1 = {
      itemType: 'Электроника',
      name: 'Дорогой товар',
      link: '',
      price: 2000,
      currency: 'RUB'
    }
    
    const item2 = {
      itemType: 'Книги',
      name: 'Дешевый товар',
      link: '',
      price: 500,
      currency: 'RUB'
    }
    
    act(() => {
      result.current.handleAddItem(item1)
    })
    
    act(() => {
      result.current.handleAddItem(item2)
    })
    
    act(() => {
      result.current.setSortBy('price-asc')
    })
    
    expect(result.current.filteredAndSortedWishlist).toHaveLength(2)
    expect(result.current.filteredAndSortedWishlist[0]).toBeDefined()
    expect(result.current.filteredAndSortedWishlist[1]).toBeDefined()
    expect(result.current.filteredAndSortedWishlist[0].price).toBe(500)
    expect(result.current.filteredAndSortedWishlist[1].price).toBe(2000)
    
    act(() => {
      result.current.setSortBy('price-desc')
    })
    
    expect(result.current.filteredAndSortedWishlist).toHaveLength(2)
    expect(result.current.filteredAndSortedWishlist[0]).toBeDefined()
    expect(result.current.filteredAndSortedWishlist[1]).toBeDefined()
    expect(result.current.filteredAndSortedWishlist[0].price).toBe(2000)
    expect(result.current.filteredAndSortedWishlist[1].price).toBe(500)
  })
}) 