'use client'

import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Recipe } from '@/types/recipe'
import { v4 as uuid } from 'uuid'
import { STARTER_RECIPES } from '@/data/starter-recipes'

async function seedIfNeeded() {
  const prefs = await db.preferences.get('app')
  if (prefs && (prefs as unknown as { seeded?: boolean }).seeded) return

  const now = new Date()
  const recipes: Recipe[] = STARTER_RECIPES.map((data, i) => ({
    ...data,
    id: uuid(),
    createdAt: new Date(now.getTime() - i * 60000),
    updatedAt: now,
  }))

  await db.recipes.bulkAdd(recipes)
  await db.preferences.put({ id: 'app', locale: 'en', theme: 'system', seeded: true } as never)
}

export function useRecipes() {
  const seeded = useRef(false)

  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true
      seedIfNeeded()
    }
  }, [])

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
