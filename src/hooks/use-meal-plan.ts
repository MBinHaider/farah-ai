'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { MealPlan, PlannedMeal, DayOfWeek, MealSlot } from '@/types/meal-plan'
import { v4 as uuid } from 'uuid'

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function useMealPlan() {
  const weekStart = getWeekStart()

  const mealPlan = useLiveQuery(async () => {
    const existing = await db.mealPlans.where('weekStart').equals(weekStart).first()
    return existing ?? null
  }, [weekStart.toISOString()])

  async function getOrCreatePlan(): Promise<MealPlan> {
    const existing = await db.mealPlans.where('weekStart').equals(weekStart).first()
    if (existing) return existing
    const plan: MealPlan = { id: uuid(), weekStart, meals: [] }
    await db.mealPlans.add(plan)
    return plan
  }

  async function addMeal(day: DayOfWeek, slot: MealSlot, recipeId: string, servings: number) {
    const plan = await getOrCreatePlan()
    const meal: PlannedMeal = { day, slot, recipeId, servings }
    const meals = [...plan.meals.filter((m) => !(m.day === day && m.slot === slot)), meal]
    await db.mealPlans.update(plan.id, { meals })
  }

  async function removeMeal(day: DayOfWeek, slot: MealSlot) {
    if (!mealPlan) return
    const meals = mealPlan.meals.filter((m) => !(m.day === day && m.slot === slot))
    await db.mealPlans.update(mealPlan.id, { meals })
  }

  return { mealPlan, addMeal, removeMeal, weekStart }
}
