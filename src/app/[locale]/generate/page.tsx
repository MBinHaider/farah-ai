'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

// --- Shimmer skeleton card for loading state ---
function ShimmerCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
      <div className="aspect-video w-full animate-shimmer" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded-md animate-shimmer" />
        <div className="h-3 w-1/2 rounded-md animate-shimmer" />
      </div>
    </div>
  )
}

export default function GeneratePage() {
  const t = useTranslations()
  const router = useRouter()
  const { addRecipe } = useRecipes()

  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('common.error'))
      }

      const recipeData = await response.json()
      const recipe = await addRecipe({
        ...recipeData,
        source: 'generated' as const,
      })

      router.push(`/recipes/${recipe.id}` as never)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-2">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('generate.title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2">
          {(['example1', 'example2', 'example3'] as const).map((key) => (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setDescription(t(`generate.${key}`))}
              disabled={loading}
              className="rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            >
              {t(`generate.${key}`)}
            </motion.button>
          ))}
        </div>

        {/* Text area — no Card wrapper */}
        <Textarea
          placeholder={t('generate.placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={5}
          className="resize-none text-base"
        />

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading: shimmer skeleton cards */}
        {loading && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">{t('generate.generating')}</p>
            <div className="grid gap-4">
              <ShimmerCard />
              <ShimmerCard />
            </div>
          </div>
        )}

        {/* Generate button — full width, large touch target */}
        <Button
          type="submit"
          className="w-full py-6 text-base"
          disabled={loading || description.trim().length < 3}
        >
          <Sparkles className="me-2 h-5 w-5" />
          {t('generate.title')}
        </Button>
      </form>
    </div>
  )
}
