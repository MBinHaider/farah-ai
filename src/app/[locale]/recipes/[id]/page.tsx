'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { adjustQuantity, toFraction } from '@/lib/utils/servings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Users, Minus, Plus, ChefHat, Trash2, ArrowLeft } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>()
  const locale = useLocale()
  const t = useTranslations()
  const router = useRouter()
  const { getRecipe, deleteRecipe } = useRecipes()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [servings, setServings] = useState(0)

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
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-24 rounded bg-muted" />
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="aspect-video rounded-lg bg-muted" />
        <div className="flex gap-4">
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="h-5 w-28 rounded bg-muted" />
        </div>
        <div className="h-px bg-muted" />
        <div className="h-12 w-48 rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-muted" style={{ width: `${80 - i * 10}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Recipe not found</p>
        <Link href="/">
          <Button variant="link" className="mt-4">
            {t('common.home')}
          </Button>
        </Link>
      </div>
    )
  }

  const title = locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title
  const description =
    locale === 'ar' && recipe.descriptionAr ? recipe.descriptionAr : recipe.description

  async function handleDelete() {
    if (!recipe) return
    await deleteRecipe(recipe.id)
    router.push('/')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2 -ms-2">
              <ArrowLeft className="me-1 h-4 w-4" />
              {t('common.home')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="me-1 h-4 w-4" />
          {t('common.delete')}
        </Button>
      </div>

      {/* Image */}
      {recipe.image && (
        <div className="aspect-video overflow-hidden rounded-lg">
          <img src={recipe.image} alt={title} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {t('recipe.prepTime')}: {recipe.prepTime}m
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {t('recipe.cookTime')}: {recipe.cookTime}m
        </span>
        {recipe.cuisine && <Badge variant="secondary">{recipe.cuisine}</Badge>}
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Serving adjuster */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{t('recipe.servings')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setServings(Math.max(1, servings - 1))}
              disabled={servings <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-lg font-bold">{servings}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setServings(servings + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recipe.ingredients')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => {
              const adjusted = adjustQuantity(ing.quantity, recipe.servings, servings)
              const name = locale === 'ar' && ing.nameAr ? ing.nameAr : ing.name
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="font-medium">
                    {toFraction(adjusted)} {ing.unit}
                  </span>
                  <span>{name}</span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recipe.steps')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {recipe.steps.map((step) => {
              const instruction =
                locale === 'ar' && step.instructionAr ? step.instructionAr : step.instruction
              return (
                <li key={step.order} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.order}
                  </span>
                  <div className="space-y-1">
                    <p>{instruction}</p>
                    {step.duration && (
                      <p className="text-sm text-muted-foreground">
                        <Clock className="me-1 inline h-3 w-3" />
                        {step.duration}m
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Nutrition */}
      {recipe.nutrition && (
        <Card>
          <CardHeader>
            <CardTitle>{t('recipe.nutrition')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/60 p-3 text-center">
                <p className="text-2xl font-bold">{recipe.nutrition.calories}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div className="rounded-xl bg-green-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{recipe.nutrition.protein}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{recipe.nutrition.carbs}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{recipe.nutrition.fat}g</p>
                <p className="text-xs text-muted-foreground">Fat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Cooking button */}
      <div className="flex justify-center pb-4">
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
