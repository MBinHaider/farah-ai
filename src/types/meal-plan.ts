export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealPlan {
  id: string
  weekStart: Date
  meals: PlannedMeal[]
}

export interface PlannedMeal {
  day: DayOfWeek
  slot: MealSlot
  recipeId: string
  servings: number
}
