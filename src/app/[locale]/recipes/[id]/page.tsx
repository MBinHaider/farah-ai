'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { adjustQuantity, toFraction } from '@/lib/utils/servings'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  Clock, Users, Minus, Plus, ChefHat, Trash2, ArrowLeft, Flame,
} from 'lucide-react'
import type { Recipe } from '@/types/recipe'

const CATEGORY_EMOJI: Record<string, string> = {
  produce: '🥕',
  protein: '🥩',
  dairy: '🧈',
  grain: '🍞',
  spice: '🧂',
  oil: '🫒',
  sweetener: '🍯',
  other: '📦',
}

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>()
  const locale = useLocale()
  const t = useTranslations()
  const router = useRouter()
  const { getRecipe, deleteRecipe } = useRecipes()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [servings, setServings] = useState(0)
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients')

  useEffect(() => {
    async function load() {
      const r = await getRecipe(params.id)
      if (r) {
        setRecipe(r)
        setServings(r.servings)
      }
      setLoading(false)
    }
    load()
  }, [params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse -mx-4 -mt-4">
        <div className="h-[40vh] bg-muted" />
        <div className="px-4 space-y-3">
          <div className="h-7 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Recipe not found</p>
        <Link href="/">
          <Button variant="link" className="mt-4">{t('common.home')}</Button>
        </Link>
      </div>
    )
  }

  const title = locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title
  const description = locale === 'ar' && recipe.descriptionAr ? recipe.descriptionAr : recipe.description

  async function handleDelete() {
    if (!recipe) return
    await deleteRecipe(recipe.id)
    router.push('/')
  }

  // Group ingredients by category
  const ingredientsByCategory = recipe.ingredients.reduce<Record<string, typeof recipe.ingredients>>((acc, ing) => {
    const cat = ing.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ing)
    return acc
  }, {})

  return (
    <div className="-mx-4 -mt-4 md:-mx-6">
      {/* Full-bleed hero image */}
      <div className="relative h-[40vh] min-h-[250px]">
        {recipe.image ? (
          <img src={recipe.image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <ChefHat className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}
        {/* Floating nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Content sheet */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="-mt-6 relative rounded-t-3xl bg-background px-4 pt-6 pb-24 md:px-6"
      >
        <h1 className="text-xl font-bold">{title}</h1>

        {/* Metadata */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {recipe.prepTime + recipe.cookTime}m
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {servings}
          </span>
          {recipe.nutrition && (
            <>
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" />
                {recipe.nutrition.calories} cal
              </span>
              <span>{recipe.nutrition.protein}g protein</span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>

        {/* Servings stepper */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium">{t('recipe.servings')}</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setServings(Math.max(1, servings - 1))}
              disabled={servings <= 1}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-6 text-center font-bold">{servings}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setServings(servings + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mt-6 flex rounded-xl bg-muted/50 p-1">
          {(['ingredients', 'steps'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t(`recipe.${tab}`)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {activeTab === 'ingredients' ? (
            <div className="space-y-4">
              {Object.entries(ingredientsByCategory).map(([category, ingredients]) => (
                <div key={category}>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold capitalize">
                    <span>{CATEGORY_EMOJI[category] || '📦'}</span>
                    {category}
                  </h3>
                  <ul className="space-y-1.5">
                    {ingredients.map((ing, i) => {
                      const adjusted = adjustQuantity(ing.quantity, recipe.servings, servings)
                      const name = locale === 'ar' && ing.nameAr ? ing.nameAr : ing.name
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-primary">{toFraction(adjusted)} {ing.unit}</span>
                          <span>{name}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <ol className="space-y-4">
              {recipe.steps.map((step) => {
                const instruction = locale === 'ar' && step.instructionAr ? step.instructionAr : step.instruction
                return (
                  <li key={step.order} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {step.order}
                    </span>
                    <div className="space-y-1 pt-0.5">
                      <p className="text-sm leading-relaxed">{instruction}</p>
                      {step.duration && (
                        <p className="text-xs text-muted-foreground">
                          <Clock className="me-1 inline h-3 w-3" />
                          {step.duration}m
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </motion.div>

      {/* Sticky Start Cooking CTA */}
      <div className="fixed bottom-20 inset-x-0 z-30 px-4 md:hidden">
        <Link href={`/cook/${recipe.id}` as never} className="block">
          <Button className="w-full gap-2 rounded-xl py-6 text-base shadow-lg">
            <ChefHat className="h-5 w-5" />
            {t('recipe.startCooking')}
          </Button>
        </Link>
      </div>
      {/* Desktop CTA */}
      <div className="hidden md:flex justify-center px-6 pb-6">
        <Link href={`/cook/${recipe.id}` as never}>
          <Button size="lg" className="gap-2">
            <ChefHat className="h-5 w-5" />
            {t('recipe.startCooking')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
