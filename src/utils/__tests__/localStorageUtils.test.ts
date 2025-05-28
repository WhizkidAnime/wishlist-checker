import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadFromLocalStorage, saveToLocalStorage } from '../localStorageUtils'
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

describe('localStorageUtils', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('saveToLocalStorage', () => {
    it('должен сохранять данные в localStorage', () => {
      const testData: WishlistItem[] = [
        {
          id: '1',
          itemType: 'Тест',
          name: 'Тестовый товар',
          link: '',
          price: 1000,
          currency: 'RUB',
          isBought: false
        }
      ]

      saveToLocalStorage('test-key', testData)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData)
      )
    })

    it('должен обрабатывать ошибки сериализации', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Создаем объект с циклической ссылкой для вызова ошибки JSON.stringify
      const circularObj: any = {}
      circularObj.self = circularObj
      
      saveToLocalStorage('test-key', circularObj as any)
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('loadFromLocalStorage', () => {
    it('должен загружать данные из localStorage', () => {
      const testData: WishlistItem[] = [
        {
          id: '1',
          itemType: 'Тест',
          name: 'Тестовый товар',
          link: '',
          price: 1000,
          currency: 'RUB',
          isBought: false
        }
      ]

      localStorageMock.setItem('test-key', JSON.stringify(testData))
      
      const result = loadFromLocalStorage('test-key')
      
      expect(result).toEqual(testData)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
    })

    it('должен возвращать null если данных нет', () => {
      const result = loadFromLocalStorage('nonexistent-key')
      
      expect(result).toBe(null)
    })

    it('должен обрабатывать ошибки парсинга JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      localStorageMock.setItem('test-key', 'invalid-json')
      
      const result = loadFromLocalStorage('test-key')
      
      expect(result).toBe(null)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
}) 