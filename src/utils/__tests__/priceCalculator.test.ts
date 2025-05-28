import { describe, it, expect } from 'vitest'
import { safeCalculate } from '../priceCalculator'

describe('safeCalculate', () => {
  it('должен корректно вычислять простые числа', () => {
    expect(safeCalculate('45500')).toBe(45500)
    expect(safeCalculate('0')).toBe(0)
    expect(safeCalculate('999.99')).toBe(999.99)
  })

  it('должен корректно вычислять математические выражения', () => {
    expect(safeCalculate('45000+500')).toBe(45500)
    expect(safeCalculate('100-20')).toBe(80)
    expect(safeCalculate('10*5')).toBe(50)
    expect(safeCalculate('100/4')).toBe(25)
  })

  it('должен игнорировать пробелы', () => {
    expect(safeCalculate('45 500')).toBe(45500)
    expect(safeCalculate(' 100 + 200 ')).toBe(300)
    expect(safeCalculate('1 000 * 2')).toBe(1000 * 2)
  })

  it('должен возвращать null для некорректных выражений', () => {
    expect(safeCalculate('abc')).toBe(null)
    expect(safeCalculate('45000++')).toBe(null)
    expect(safeCalculate('100//5')).toBe(null)
    expect(safeCalculate('alert("hack")')).toBe(null)
    expect(safeCalculate('')).toBe(null)
  })

  it('должен обрабатывать деление на ноль', () => {
    expect(safeCalculate('100/0')).toBe(null)
  })

  it('должен корректно работать с отрицательными числами', () => {
    expect(safeCalculate('-100')).toBe(-100)
    expect(safeCalculate('100+-50')).toBe(50)
    expect(safeCalculate('-100*-2')).toBe(200)
  })
}) 