'use client'

import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Recipe } from '@/types/recipe'
import { v4 as uuid } from 'uuid'
import { STARTER_RECIPES, SEED_VERSION } from '@/data/starter-recipes'

async function seedIfNeeded() {
  const prefs = await db.preferences.get('app')
  const currentVersion = (prefs as unknown as { seedVersion?: number })?.seedVersion ?? 0
  // Treat old boolean seeded as version 1
  const effectiveVersion =
    currentVersion > 0
      ? currentVersion
      : prefs && (prefs as unknown as { seeded?: boolean }).seeded
        ? 1
        : 0

  if (effectiveVersion >= SEED_VERSION) return

  const now = new Date()

  if (effectiveVersion === 0) {
    // Fresh install — seed all recipes
    const recipes: Recipe[] = STARTER_RECIPES.map((data, i) => ({
      ...data,
      id: uuid(),
      createdAt: new Date(now.getTime() - i * 60000),
      updatedAt: now,
    }))
    await db.recipes.bulkAdd(recipes)
  } else {
    // Existing user — only add new recipes (those added after their version)
    // v1 had 6 recipes (index 1-6), v2 adds the featured recipe at index 0
    const newRecipes = STARTER_RECIPES.slice(0, STARTER_RECIPES.length - 6)
    const recipes: Recipe[] = newRecipes.map((data) => ({
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    }))
    if (recipes.length > 0) await db.recipes.bulkAdd(recipes)
  }

  await db.preferences.put({
    id: 'app',
    locale: prefs ? (prefs as unknown as { locale: string }).locale : 'en',
    theme: prefs ? (prefs as unknown as { theme: string }).theme : 'system',
    seeded: true,
    seedVersion: SEED_VERSION,
  } as never)
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
