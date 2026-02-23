'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useMealPlan } from '@/hooks/use-meal-plan'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, X, ShoppingCart, Clock } from 'lucide-react'
import type { DayOfWeek, MealSlot } from '@/types/meal-plan'

const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

const DAY_LABELS_EN: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

const DAY_LABELS_AR: Record<DayOfWeek, string> = {
  mon: 'الاثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة',
  sat: 'السبت',
  sun: 'الأحد',
}

export default function MealPlanPage() {
  const locale = useLocale()
  const t = useTranslations('plan')
  const { mealPlan, addMeal, removeMeal } = useMealPlan()
  const { recipes } = useRecipes()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon')
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>('breakfast')

  const dayLabels = locale === 'ar' ? DAY_LABELS_AR : DAY_LABELS_EN

  function getMeal(day: DayOfWeek, slot: MealSlot) {
    return mealPlan?.meals.find((m) => m.day === day && m.slot === slot)
  }

  function getRecipeTitle(recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return '...'
    return locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title
  }

  function getRecipeTime(recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return 0
    return recipe.prepTime + recipe.cookTime
  }

  function openRecipePicker(day: DayOfWeek, slot: MealSlot) {
    setSelectedDay(day)
    setSelectedSlot(slot)
    setDialogOpen(true)
  }

  async function handleSelectRecipe(recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return
    await addMeal(selectedDay, selectedSlot, recipeId, recipe.servings)
    setDialogOpen(false)
  }

  async function handleRemoveMeal(day: DayOfWeek, slot: MealSlot) {
    await removeMeal(day, slot)
  }

  function getSlotLabel(slot: MealSlot): string {
    return t(slot)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('thisWeek')}</p>
        </div>
        <Link href="/grocery">
          <Button variant="outline" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            {t('generateGroceryList')}
          </Button>
        </Link>
      </div>

      {/* Desktop: Weekly Grid */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-start text-sm font-medium text-muted-foreground" />
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="border p-2 text-center text-sm font-medium"
                >
                  {dayLabels[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="border p-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
                  {getSlotLabel(slot)}
                </td>
                {DAYS.map((day) => {
                  const meal = getMeal(day, slot)
                  return (
                    <td key={`${day}-${slot}`} className="border p-2 min-w-[120px]">
                      {meal ? (
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-medium leading-tight line-clamp-2">
                            {getRecipeTitle(meal.recipeId)}
                          </span>
                          <button
                            onClick={() => handleRemoveMeal(day, slot)}
                            className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openRecipePicker(day, slot)}
                          className="flex h-8 w-full items-center justify-center rounded border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:border-primary/50 hover:text-primary/70 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Day-by-day cards */}
      <div className="space-y-4 md:hidden">
        {DAYS.map((day) => (
          <Card key={day}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{dayLabels[day]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SLOTS.map((slot) => {
                const meal = getMeal(day, slot)
                return (
                  <div key={slot} className="flex items-center justify-between gap-2">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">
                      {getSlotLabel(slot)}
                    </span>
                    {meal ? (
                      <div className="flex flex-1 items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1">
                        <span className="text-sm font-medium truncate">
                          {getRecipeTitle(meal.recipeId)}
                        </span>
                        <button
                          onClick={() => handleRemoveMeal(day, slot)}
                          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openRecipePicker(day, slot)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/30 px-2 py-1 text-xs text-muted-foreground/50 hover:border-primary/50 hover:text-primary/70 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recipe Picker Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dayLabels[selectedDay]} - {getSlotLabel(selectedSlot)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {recipes.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recipes available
              </p>
            ) : (
              recipes.map((recipe) => {
                const title =
                  locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title
                const totalTime = recipe.prepTime + recipe.cookTime
                return (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe.id)}
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-start hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium">{title}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {totalTime}m
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
