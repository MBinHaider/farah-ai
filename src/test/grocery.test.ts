import { describe, it, expect } from 'vitest'
import { aggregateGroceryItems } from '@/lib/utils/grocery'

describe('aggregateGroceryItems', () => {
  it('combines same ingredient with same unit', () => {
    const meals = [
      { ingredients: [{ name: 'Flour', quantity: 200, unit: 'g', category: 'grain' }], servingsMultiplier: 1 },
      { ingredients: [{ name: 'Flour', quantity: 100, unit: 'g', category: 'grain' }], servingsMultiplier: 1 },
    ]
    const result = aggregateGroceryItems(meals)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(300)
  })

  it('keeps different ingredients separate', () => {
    const meals = [
      { ingredients: [{ name: 'Flour', quantity: 200, unit: 'g', category: 'grain' }], servingsMultiplier: 1 },
      { ingredients: [{ name: 'Sugar', quantity: 100, unit: 'g', category: 'sweetener' }], servingsMultiplier: 1 },
    ]
    const result = aggregateGroceryItems(meals)
    expect(result).toHaveLength(2)
  })

  it('applies servings multiplier', () => {
    const meals = [
      { ingredients: [{ name: 'Flour', quantity: 200, unit: 'g', category: 'grain' }], servingsMultiplier: 2 },
    ]
    const result = aggregateGroceryItems(meals)
    expect(result[0].quantity).toBe(400)
  })

  it('keeps same ingredient with different units separate', () => {
    const meals = [
      { ingredients: [{ name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy' }], servingsMultiplier: 1 },
      { ingredients: [{ name: 'Milk', quantity: 500, unit: 'ml', category: 'dairy' }], servingsMultiplier: 1 },
    ]
    const result = aggregateGroceryItems(meals)
    expect(result).toHaveLength(2)
  })

  it('sorts by category', () => {
    const meals = [
      {
        ingredients: [
          { name: 'Salt', quantity: 1, unit: 'tsp', category: 'spice' },
          { name: 'Chicken', quantity: 500, unit: 'g', category: 'protein' },
          { name: 'Tomato', quantity: 2, unit: 'pcs', category: 'produce' },
        ],
        servingsMultiplier: 1,
      },
    ]
    const result = aggregateGroceryItems(meals)
    const categories = result.map((item) => item.category)
    expect(categories).toEqual([...categories].sort())
  })
})
