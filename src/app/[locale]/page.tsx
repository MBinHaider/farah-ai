'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { RecipeCard } from '@/components/recipe-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Import, Sparkles, Film, CookingPot, Salad, ChefHat, Star } from 'lucide-react'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { isVideoUrl } from '@/lib/video-utils'

export default function Home() {
  const t = useTranslations()
  const locale = useLocale()
  const { recipes } = useRecipes()
  const [search, setSearch] = useState('')

  // Featured recipe (tagged 'featured')
  const featuredRecipe = recipes.find((r) =>
    r.tags.some((tag) => tag.toLowerCase() === 'featured'),
  )

  // Section filters
  const videoRecipes = recipes.filter(
    (r) => r.source === 'import' && r.sourceUrl && isVideoUrl(r.sourceUrl),
  )
  const soupRecipes = recipes.filter((r) =>
    r.tags.some((tag) => tag.toLowerCase() === 'soup'),
  )
  const saladRecipes = recipes.filter((r) =>
    r.tags.some((tag) => tag.toLowerCase() === 'salad'),
  )

  // Search across all recipes
  const filtered = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.titleAr && r.titleAr.includes(search)) ||
      r.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">{t('home.title')}</h1>
        <div className="flex gap-2">
          <Link href="/import">
            <Button size="sm">{t('common.import')}</Button>
          </Link>
          <Link href="/generate">
            <Button size="sm" variant="secondary">
              {t('common.generate')}
            </Button>
          </Link>
        </div>
      </div>

      {recipes.length === 0 ? (
        /* Empty state — only when truly empty (before seeding finishes) */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">{t('home.emptyTitle')}</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">{t('home.emptySubtitle')}</p>
          <div className="mt-6 flex gap-3">
            <Link href="/import">
              <Button className="gap-2">
                <Import className="h-4 w-4" />
                {t('common.import')}
              </Button>
            </Link>
            <Link href="/generate">
              <Button variant="secondary" className="gap-2">
                <Sparkles className="h-4 w-4" />
                {t('common.generate')}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Featured hero card */}
          {featuredRecipe && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{t('home.featured')}</h2>
              </div>
              <Link href={`/recipes/${featuredRecipe.id}` as never}>
                <div className="group overflow-hidden rounded-2xl bg-card shadow-sm transition-all duration-200 hover:shadow-lg sm:grid sm:grid-cols-2">
                  {/* Image — full width on mobile, left half on desktop */}
                  {featuredRecipe.image ? (
                    <div className="aspect-video overflow-hidden sm:aspect-auto sm:h-full">
                      <img
                        src={featuredRecipe.image}
                        alt={
                          locale === 'ar' && featuredRecipe.titleAr
                            ? featuredRecipe.titleAr
                            : featuredRecipe.title
                        }
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 sm:aspect-auto sm:h-full">
                      <ChefHat className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Text — below on mobile, right half on desktop */}
                  <div className="flex flex-col justify-center gap-2 p-4 sm:p-6">
                    <h3 className="text-xl font-bold sm:text-2xl">
                      {locale === 'ar' && featuredRecipe.titleAr
                        ? featuredRecipe.titleAr
                        : featuredRecipe.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {locale === 'ar' && featuredRecipe.descriptionAr
                        ? featuredRecipe.descriptionAr
                        : featuredRecipe.description}
                    </p>
                    <div className="mt-1">
                      <Button size="sm" className="gap-2">
                        <ChefHat className="h-4 w-4" />
                        {t('home.cookNow')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* From Videos section */}
          {videoRecipes.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Film className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{t('home.fromVideos')}</h2>
              </div>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videoRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </section>
          )}

          {/* Soups section */}
          {soupRecipes.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CookingPot className="h-5 w-5 text-secondary" />
                <h2 className="text-lg font-semibold">{t('home.soups')}</h2>
              </div>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {soupRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </section>
          )}

          {/* Salads section */}
          {saladRecipes.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Salad className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{t('home.salads')}</h2>
              </div>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {saladRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </section>
          )}

          {/* All Recipes section with search */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t('home.allRecipes')}</h2>
            <Input
              placeholder={t('home.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 w-full max-w-md"
            />
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
