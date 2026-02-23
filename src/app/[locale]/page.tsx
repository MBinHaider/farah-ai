'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { RecipeCard } from '@/components/recipe-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function Home() {
  const t = useTranslations()
  const { recipes } = useRecipes()
  const [search, setSearch] = useState('')

  const filtered = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.titleAr && r.titleAr.includes(search)) ||
      r.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('home.title')}</h1>
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

      <Input
        placeholder={t('home.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <p>{t('home.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
