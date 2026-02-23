import { describe, it, expect } from 'vitest'
import { adjustQuantity, toFraction } from '@/lib/utils/servings'

describe('adjustQuantity', () => {
  it('scales quantity up', () => {
    expect(adjustQuantity(200, 4, 8)).toBe(400)
  })
  it('scales quantity down', () => {
    expect(adjustQuantity(200, 4, 2)).toBe(100)
  })
  it('returns same quantity for same servings', () => {
    expect(adjustQuantity(200, 4, 4)).toBe(200)
  })
  it('handles fractional results', () => {
    expect(adjustQuantity(1, 4, 6)).toBeCloseTo(1.5)
  })
})

describe('toFraction', () => {
  it('displays whole numbers as-is', () => {
    expect(toFraction(2)).toBe('2')
  })
  it('displays 0.5 as ½', () => {
    expect(toFraction(0.5)).toBe('½')
  })
  it('displays 0.25 as ¼', () => {
    expect(toFraction(0.25)).toBe('¼')
  })
  it('displays 0.75 as ¾', () => {
    expect(toFraction(0.75)).toBe('¾')
  })
  it('displays 0.333 as ⅓', () => {
    expect(toFraction(1 / 3)).toBe('⅓')
  })
  it('displays 0.667 as ⅔', () => {
    expect(toFraction(2 / 3)).toBe('⅔')
  })
  it('displays 1.5 as 1 ½', () => {
    expect(toFraction(1.5)).toBe('1 ½')
  })
  it('rounds non-standard fractions to 2 decimals', () => {
    expect(toFraction(1.37)).toBe('1.37')
  })
})
