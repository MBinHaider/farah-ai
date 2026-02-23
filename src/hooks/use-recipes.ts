'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Recipe } from '@/types/recipe'
import { v4 as uuid } from 'uuid'

export function useRecipes() {
  const recipes = useLiveQuery(() => db.recipes.orderBy('createdAt').reverse().toArray()) ?? []

  async function addRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
    const recipe: Recipe = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.recipes.add(recipe)
    return recipe
  }

  async function updateRecipe(id: string, data: Partial<Recipe>) {
    await db.recipes.update(id, { ...data, updatedAt: new Date() })
  }

  async function deleteRecipe(id: string) {
    await db.recipes.delete(id)
  }

  async function getRecipe(id: string) {
    return db.recipes.get(id)
  }

  return { recipes, addRecipe, updateRecipe, deleteRecipe, getRecipe }
}
