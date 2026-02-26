'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { RecipeCard } from '@/components/recipe-card'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Fab } from '@/components/ui/fab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, Sparkles, Film, Star, Import, ChefHat, Loader2, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { isVideoUrl } from '@/lib/video-utils'

export default function Home() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { recipes, addRecipe } = useRecipes()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')

  // Featured recipe (tagged 'featured')
  const featuredRecipe = recipes.find((r) =>
    r.tags.some((tag) => tag.toLowerCase() === 'featured'),
  )

  // Section filters
  const soupRecipes = recipes.filter((r) =>
    r.tags.some((tag) => tag.toLowerCase() === 'soup'),
  )
  const saladRecipes = recipes.filter((r) =>
    r.tags.some((tag) => tag.toLowerCase() === 'salad'),
  )

  // Search
  const filtered = search
    ? recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          (r.titleAr && r.titleAr.includes(search)) ||
          r.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
      )
    : null

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    setImportError('')
    setImportLoading(true)
    try {
      const body: Record<string, string> = {}
      if (importText.trim()) body.text = importText.trim()
      if (importUrl.trim()) body.url = importUrl.trim()
      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('import.error'))
      }
      const recipeData = await response.json()
      const recipe = await addRecipe({
        ...recipeData,
        source: 'import' as const,
        sourceUrl: importUrl.trim() || undefined,
      })
      setImportOpen(false)
      setImportText('')
      setImportUrl('')
      router.push(`/recipes/${recipe.id}` as never)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('import.error'))
    } finally {
      setImportLoading(false)
    }
  }

  // Helper for horizontal scroll section
  function CarouselSection({ title, icon, recipeList }: { title: string; icon: React.ReactNode; recipeList: typeof recipes }) {
    if (recipeList.length === 0) return null
    return (
      <section>
        <div className="mb-3 flex items-center gap-2">
          {icon}
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {recipeList.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} variant="compact" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search bar (expandable) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('home.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSearchOpen(false); setSearch('') }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search icon trigger (only when search is closed) */}
      {!searchOpen && (
        <div className="flex justify-end -mt-2">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">{t('home.emptyTitle')}</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">{t('home.emptySubtitle')}</p>
          <div className="mt-6 flex gap-3">
            <Link href="/generate">
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                {t('common.generate')}
              </Button>
            </Link>
          </div>
        </div>
      ) : filtered ? (
        /* Search results */
        <section>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} variant="full" />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No recipes found</p>
          )}
        </section>
      ) : (
        <>
          {/* Featured hero */}
          {featuredRecipe && (
            <section>
              <Link href={`/recipes/${featuredRecipe.id}` as never}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  {featuredRecipe.image ? (
                    <img
                      src={featuredRecipe.image}
                      alt={locale === 'ar' && featuredRecipe.titleAr ? featuredRecipe.titleAr : featuredRecipe.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <ChefHat className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-white/80">
                      <Star className="h-3.5 w-3.5" />
                      {t('home.featured')}
                    </div>
                    <h2 className="text-lg font-bold leading-tight">
                      {locale === 'ar' && featuredRecipe.titleAr ? featuredRecipe.titleAr : featuredRecipe.title}
                    </h2>
                    <p className="mt-1 text-xs text-white/70">
                      {featuredRecipe.prepTime + featuredRecipe.cookTime}m · {featuredRecipe.servings} {t('recipe.servings').toLowerCase()}
                    </p>
                  </div>
                </motion.div>
              </Link>
            </section>
          )}

          {/* Quick Actions */}
          <section className="flex gap-3">
            <Link href="/generate" className="flex-1">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
              >
                <Sparkles className="h-4 w-4" />
                {t('home.askAi')}
              </motion.div>
            </Link>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setImportOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-accent"
            >
              <Film className="h-4 w-4" />
              {t('home.fromVideo')}
            </motion.button>
          </section>

          {/* Carousels */}
          <CarouselSection
            title={t('home.yourRecipes')}
            icon={<ChefHat className="h-4 w-4 text-primary" />}
            recipeList={recipes}
          />
          <CarouselSection
            title={t('home.soups')}
            icon={<span className="text-base">🍲</span>}
            recipeList={soupRecipes}
          />
          <CarouselSection
            title={t('home.salads')}
            icon={<span className="text-base">🥗</span>}
            recipeList={saladRecipes}
          />
        </>
      )}

      {/* FAB for import */}
      {recipes.length > 0 && !filtered && (
        <Fab onClick={() => setImportOpen(true)} label={t('home.importRecipe')} />
      )}

      {/* Import bottom sheet */}
      <BottomSheet open={importOpen} onClose={() => setImportOpen(false)} title={t('home.importRecipe')}>
        <form onSubmit={handleImport} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('home.pasteText')}</label>
            <Textarea
              placeholder={t('import.pasteText')}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              disabled={importLoading || importUrl.trim().length > 0}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('home.pasteUrl')}</label>
            <Input
              type="url"
              placeholder="https://..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              disabled={importLoading || importText.trim().length > 0}
            />
            <p className="text-xs text-muted-foreground">{t('import.urlHint')}</p>
          </div>
          {importError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{importError}</div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={importLoading || (!importText.trim() && !importUrl.trim())}
          >
            {importLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {importUrl.trim() && isVideoUrl(importUrl.trim()) ? t('import.importingVideo') : t('import.importing')}
              </>
            ) : (
              <>
                <Import className="me-2 h-4 w-4" />
                {t('home.importRecipe')}
              </>
            )}
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
