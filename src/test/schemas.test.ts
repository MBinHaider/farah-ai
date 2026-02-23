import { describe, it, expect } from 'vitest'
import { recipeSchema, ingredientSchema, stepSchema } from '@/lib/schemas'

describe('recipeSchema', () => {
  it('validates a complete recipe', () => {
    const recipe = {
      title: 'Pasta',
      description: 'Simple pasta',
      servings: 4,
      prepTime: 10,
      cookTime: 20,
      tags: ['italian'],
      ingredients: [
        { name: 'Pasta', quantity: 500, unit: 'g', category: 'grain' },
      ],
      steps: [
        { order: 1, instruction: 'Boil water' },
      ],
    }
    const result = recipeSchema.safeParse(recipe)
    expect(result.success).toBe(true)
  })

  it('rejects recipe with missing title', () => {
    const recipe = {
      description: 'No title',
      servings: 4,
      prepTime: 10,
      cookTime: 20,
      tags: [],
      ingredients: [],
      steps: [],
    }
    const result = recipeSchema.safeParse(recipe)
    expect(result.success).toBe(false)
  })

  it('rejects recipe with zero servings', () => {
    const recipe = {
      title: 'Bad',
      description: 'Zero servings',
      servings: 0,
      prepTime: 10,
      cookTime: 20,
      tags: [],
      ingredients: [],
      steps: [],
    }
    const result = recipeSchema.safeParse(recipe)
    expect(result.success).toBe(false)
  })
})

describe('ingredientSchema', () => {
  it('accepts optional Arabic name', () => {
    const ingredient = { name: 'Salt', nameAr: 'ملح', quantity: 1, unit: 'tsp', category: 'spice' }
    expect(ingredientSchema.safeParse(ingredient).success).toBe(true)
  })

  it('rejects negative quantity', () => {
    const ingredient = { name: 'Salt', quantity: -1, unit: 'tsp', category: 'spice' }
    expect(ingredientSchema.safeParse(ingredient).success).toBe(false)
  })
})
