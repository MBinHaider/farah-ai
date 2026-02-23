import Dexie, { type EntityTable } from 'dexie'
import type { Recipe } from '@/types/recipe'
import type { MealPlan } from '@/types/meal-plan'
import type { GroceryList } from '@/types/grocery'

interface UserPreferences {
  id: string
  locale: 'en' | 'ar'
  theme: 'light' | 'dark' | 'system'
}

const database = new Dexie('RecipeAppDB') as Dexie & {
  recipes: EntityTable<Recipe, 'id'>
  mealPlans: EntityTable<MealPlan, 'id'>
  groceryLists: EntityTable<GroceryList, 'id'>
  preferences: EntityTable<UserPreferences, 'id'>
}

database.version(1).stores({
  recipes: 'id, title, cuisine, source, createdAt',
  mealPlans: 'id, weekStart',
  groceryLists: 'id, mealPlanId, createdAt',
  preferences: 'id',
})

export { database as db }
