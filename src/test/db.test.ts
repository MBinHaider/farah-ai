import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import type { Recipe } from '@/types/recipe'

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'test-1',
  title: 'Test Recipe',
  description: 'A test recipe',
  servings: 4,
  prepTime: 10,
  cookTime: 20,
  tags: ['test'],
  ingredients: [{ name: 'Flour', quantity: 200, unit: 'g', category: 'grain' }],
  steps: [{ order: 1, instruction: 'Mix ingredients' }],
  source: 'manual',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('db.recipes', () => {
  beforeEach(async () => {
    await db.recipes.clear()
  })

  it('adds and retrieves a recipe', async () => {
    const recipe = makeRecipe()
    await db.recipes.add(recipe)
    const retrieved = await db.recipes.get('test-1')
    expect(retrieved?.title).toBe('Test Recipe')
  })

  it('lists all recipes', async () => {
    await db.recipes.bulkAdd([
      makeRecipe({ id: 'r1', title: 'Recipe 1' }),
      makeRecipe({ id: 'r2', title: 'Recipe 2' }),
    ])
    const all = await db.recipes.toArray()
    expect(all).toHaveLength(2)
  })

  it('deletes a recipe', async () => {
    await db.recipes.add(makeRecipe())
    await db.recipes.delete('test-1')
    const retrieved = await db.recipes.get('test-1')
    expect(retrieved).toBeUndefined()
  })

  it('updates a recipe', async () => {
    await db.recipes.add(makeRecipe())
    await db.recipes.update('test-1', { title: 'Updated Title' })
    const retrieved = await db.recipes.get('test-1')
    expect(retrieved?.title).toBe('Updated Title')
  })
})
