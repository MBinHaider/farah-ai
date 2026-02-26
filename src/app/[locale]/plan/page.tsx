'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useMealPlan } from '@/hooks/use-meal-plan'
import { useRecipes } from '@/hooks/use-recipes'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { motion } from 'framer-motion'
import { Plus, X, ShoppingCart, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DayOfWeek, MealSlot } from '@/types/meal-plan'

const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

const SLOT_EMOJI: Record<MealSlot, string> = {
  breakfast: '\u{1F305}',
  lunch: '\u{1F37D}\u{FE0F}',
  dinner: '\u{1F319}',
  snack: '\u{1F37F}',
}

const DAY_LABELS_EN: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const DAY_LABELS_AR: Record<DayOfWeek, string> = {
  mon: '\u0627\u0644\u0627\u062B\u0646\u064A\u0646',
  tue: '\u0627\u0644\u062B\u0644\u0627\u062B\u0627\u0621',
  wed: '\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621',
  thu: '\u0627\u0644\u062E\u0645\u064A\u0633',
  fri: '\u0627\u0644\u062C\u0645\u0639\u0629',
  sat: '\u0627\u0644\u0633\u0628\u062A',
  sun: '\u0627\u0644\u0623\u062D\u062F',
}

export default function MealPlanPage() {
  const locale = useLocale()
  const t = useTranslations('plan')
  const router = useRouter()
  const { mealPlan, addMeal, removeMeal } = useMealPlan()
  const { recipes } = useRecipes()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon')
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>('breakfast')

  const dayLabels = locale === 'ar' ? DAY_LABELS_AR : DAY_LABELS_EN

  function getMeal(day: DayOfWeek, slot: MealSlot) {
    return mealPlan?.meals.find((m) => m.day === day && m.slot === slot)
  }

  function getRecipe(recipeId: string) {
    return recipes.find((r) => r.id === recipeId)
  }

  function getRecipeTitle(recipeId: string) {
    const recipe = getRecipe(recipeId)
    if (!recipe) return '...'
    return locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title
  }


  function openRecipePicker(day: DayOfWeek, slot: MealSlot) {
    setSelectedDay(day)
    setSelectedSlot(slot)
    setSheetOpen(true)
  }

  async function handleSelectRecipe(recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return
    await addMeal(selectedDay, selectedSlot, recipeId, recipe.servings)
    setSheetOpen(false)
  }

  async function handleRemoveMeal(day: DayOfWeek, slot: MealSlot) {
    await removeMeal(day, slot)
  }

  function getSlotLabel(slot: MealSlot): string {
    return t(slot)
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-24 md:max-w-2xl">
      {/* Week navigation header */}
      <div className="flex items-center justify-between">
        <button disabled className="rounded-full p-2 text-muted-foreground/30 cursor-default">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('thisWeek')}</p>
        </div>
        <button disabled className="rounded-full p-2 text-muted-foreground/30 cursor-default">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Vertical day sections */}
      <div className="space-y-3">
        {DAYS.map((day, dayIndex) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.04 }}
            className="rounded-2xl bg-card p-4 shadow-sm"
          >
            <h2 className="mb-3 text-base font-semibold">{dayLabels[day]}</h2>
            <div className="space-y-2">
              {SLOTS.map((slot) => {
                const meal = getMeal(day, slot)
                const recipe = meal ? getRecipe(meal.recipeId) : null
                return (
                  <div key={slot} className="flex items-center gap-3">
                    {/* Emoji + slot label */}
                    <div className="flex w-24 shrink-0 items-center gap-1.5">
                      <span className="text-base">{SLOT_EMOJI[slot]}</span>
                      <span className="text-xs text-muted-foreground">{getSlotLabel(slot)}</span>
                    </div>

                    {meal && recipe ? (
                      <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/40 p-2">
                        {/* Recipe thumbnail */}
                        {recipe.image && (
                          <img
                            src={recipe.image}
                            alt={getRecipeTitle(meal.recipeId)}
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                            loading="lazy"
                          />
                        )}
                        <span className="flex-1 truncate text-sm font-medium">
                          {getRecipeTitle(meal.recipeId)}
                        </span>
                        <button
                          onClick={() => handleRemoveMeal(day, slot)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openRecipePicker(day, slot)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl border-2 border-dashed border-muted-foreground/20 px-3 py-2.5 text-xs text-muted-foreground/50 transition-colors hover:border-primary/40 hover:text-primary/70"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sticky View Grocery List CTA */}
      <div className="fixed inset-x-0 bottom-16 z-40 px-4 pb-2 md:bottom-0 md:pb-4">
        <div className="mx-auto max-w-lg md:max-w-2xl">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/grocery' as never)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg"
          >
            <ShoppingCart className="h-4 w-4" />
            {t('viewGroceryList')}
          </motion.button>
        </div>
      </div>

      {/* Recipe Picker BottomSheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={`${dayLabels[selectedDay]} \u2014 ${getSlotLabel(selectedSlot)}`}
      >
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
                <motion.button
                  key={recipe.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectRecipe(recipe.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/50 p-3 text-start transition-colors hover:bg-muted/50"
                >
                  {recipe.image && (
                    <img
                      src={recipe.image}
                      alt={title}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}
                  <span className="flex-1 truncate font-medium">{title}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {totalTime}m
                  </span>
                </motion.button>
              )
            })
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
