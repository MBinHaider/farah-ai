'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'

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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t('generate.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('generate.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">{t('generate.title')}</Label>
              <div className="flex flex-wrap gap-2 pb-1">
                {(['example1', 'example2', 'example3'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDescription(t(`generate.${key}`))}
                    disabled={loading}
                    className="rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                  >
                    {t(`generate.${key}`)}
                  </button>
                ))}
              </div>
              <Textarea
                id="description"
                placeholder={t('generate.placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={4}
                className="resize-none"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || description.trim().length < 3}
            >
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('generate.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="me-2 h-4 w-4" />
                  {t('generate.title')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
