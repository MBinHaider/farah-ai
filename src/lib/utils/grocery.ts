import type { Ingredient } from '@/types/recipe'
import type { GroceryItem } from '@/types/grocery'

interface MealIngredients {
  ingredients: Ingredient[]
  servingsMultiplier: number
}

export function aggregateGroceryItems(meals: MealIngredients[]): GroceryItem[] {
  const map = new Map<string, GroceryItem>()

  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`
      const existing = map.get(key)

      if (existing) {
        existing.quantity += ing.quantity * meal.servingsMultiplier
      } else {
        map.set(key, {
          name: ing.name,
          nameAr: ing.nameAr,
          quantity: ing.quantity * meal.servingsMultiplier,
          unit: ing.unit,
          category: ing.category,
          checked: false,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category))
}
