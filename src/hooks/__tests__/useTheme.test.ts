import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTheme } from '../useTheme'

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

// Мок для document.querySelector
const mockMetaTag = {
  setAttribute: vi.fn()
}

Object.defineProperty(document, 'querySelector', {
  value: vi.fn(() => mockMetaTag)
})

// Мок для document.documentElement
const mockHtml = {
  classList: {
    add: vi.fn(),
    remove: vi.fn()
  }
}

Object.defineProperty(document, 'documentElement', {
  value: mockHtml
})

// Мок для window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('useTheme', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('должен инициализироваться светлой темой по умолчанию', () => {
    const { result } = renderHook(() => useTheme())
    
    expect(result.current.theme).toBe('light')
  })

  it('должен корректно переключать тему', () => {
    const { result } = renderHook(() => useTheme())
    
    act(() => {
      result.current.toggleTheme()
    })
    
    expect(result.current.theme).toBe('dark')
    
    act(() => {
      result.current.toggleTheme()
    })
    
    expect(result.current.theme).toBe('light')
  })

  it('должен сохранять тему в localStorage', () => {
    const { result } = renderHook(() => useTheme())
    
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('wishlist-theme', 'dark')
  })

  it('должен загружать сохраненную тему из localStorage', () => {
    localStorageMock.setItem('wishlist-theme', 'dark')
    
    const { result } = renderHook(() => useTheme())
    
    expect(result.current.theme).toBe('dark')
  })

  it('должен обновлять meta тег theme-color', () => {
    const { result } = renderHook(() => useTheme())
    
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(mockMetaTag.setAttribute).toHaveBeenCalledWith('content', '#141414')
  })

  it('должен добавлять/убирать класс dark на html элемент', () => {
    const { result } = renderHook(() => useTheme())
    
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(mockHtml.classList.add).toHaveBeenCalledWith('dark')
    
    act(() => {
      result.current.setTheme('light')
    })
    
    expect(mockHtml.classList.remove).toHaveBeenCalledWith('dark')
  })

  it('должен возвращать конфигурацию темы', () => {
    const { result } = renderHook(() => useTheme())
    
    const config = result.current.getThemeConfig()
    
    expect(config).toHaveProperty('background')
    expect(config).toHaveProperty('cardBackground')
    expect(config).toHaveProperty('text')
    expect(config).toHaveProperty('themeColor')
  })
}) 