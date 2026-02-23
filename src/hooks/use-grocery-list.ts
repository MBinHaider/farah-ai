'use client'

import { useState, useEffect } from 'react'
import { useMealPlan } from './use-meal-plan'
import { useRecipes } from './use-recipes'
import { aggregateGroceryItems } from '@/lib/utils/grocery'
import type { GroceryItem } from '@/types/grocery'

export function useGroceryList() {
  const { mealPlan } = useMealPlan()
  const { recipes } = useRecipes()
  const [items, setItems] = useState<GroceryItem[]>([])

  useEffect(() => {
    if (!mealPlan || mealPlan.meals.length === 0) {
      setItems([])
      return
    }
    const mealIngredients = mealPlan.meals
      .map((meal) => {
        const recipe = recipes.find((r) => r.id === meal.recipeId)
        if (!recipe) return null
        return {
          ingredients: recipe.ingredients,
          servingsMultiplier: meal.servings / recipe.servings,
        }
      })
      .filter(Boolean) as { ingredients: typeof recipes[0]['ingredients']; servingsMultiplier: number }[]
    setItems(aggregateGroceryItems(mealIngredients))
  }, [mealPlan, recipes])

  function toggleItem(index: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
    )
  }

  return { items, toggleItem }
}
