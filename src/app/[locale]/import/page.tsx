'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Import, Upload, Info } from 'lucide-react'

export default function ImportPage() {
  const t = useTranslations()
  const router = useRouter()
  const { addRecipe } = useRecipes()

  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasText = text.trim().length > 0
  const hasUrl = url.trim().length > 0
  const isVideoLink = hasUrl && /youtube|youtu\.be|tiktok|instagram/.test(url)
  const isSocialVideoLink = hasUrl && /tiktok|instagram/.test(url)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Don't submit TikTok/Instagram URLs directly — guide user to upload
    if (isSocialVideoLink) {
      setLoading(false)
      return
    }

    try {
      const body: Record<string, string> = {}
      if (hasText) body.text = text.trim()
      if (hasUrl) body.url = url.trim()

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
        sourceUrl: hasUrl ? url.trim() : undefined,
      })

      router.push(`/recipes/${recipe.id}` as never)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('import.error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVideoUpload(file: File) {
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setError(t('import.fileTooLarge'))
      return
    }

    setError('')
    setLoading(true)
    setVideoFile(file)

    try {
      const formData = new FormData()
      formData.append('video', file)

      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('import.error'))
      }

      const recipeData = await response.json()
      const recipe = await addRecipe({
        ...recipeData,
        source: 'import' as const,
        sourceUrl: hasUrl ? url.trim() : undefined,
      })

      router.push(`/recipes/${recipe.id}` as never)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
      setVideoFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">{t('import.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Import className="h-5 w-5" />
            {t('import.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipe-text">{t('import.pasteText')}</Label>
              <Textarea
                id="recipe-text"
                placeholder={t('import.pasteText')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading || hasUrl}
                rows={8}
                className="resize-none"
              />
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <span className="relative bg-card px-2 text-xs uppercase text-muted-foreground">
                {t('import.pasteUrl').replace(/^or /i, '').replace(/^أو /, '')}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe-url">{t('import.pasteUrl')}</Label>
              <Input
                id="recipe-url"
                type="url"
                placeholder="https://example.com/recipe"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading || hasText}
              />
              <p className="text-xs text-muted-foreground">
                {t('import.urlHint')}
              </p>
            </div>

            {isSocialVideoLink && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground">
                    {t('import.videoUploadHint')}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleVideoUpload(file)
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="me-2 h-4 w-4" />
                  {t('import.uploadVideo')}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('import.maxFileSize')}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (!hasText && !hasUrl) || isSocialVideoLink}
            >
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {videoFile ? t('import.uploadingVideo') : isVideoLink ? t('import.importingVideo') : t('import.importing')}
                </>
              ) : (
                <>
                  <Import className="me-2 h-4 w-4" />
                  {t('import.title')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
