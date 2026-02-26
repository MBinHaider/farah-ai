# Automatic TikTok/Instagram Link Processing — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make TikTok and Instagram recipe links work automatically — paste a link, get a recipe — using the Supadata transcript API.

**Architecture:** Replace manual video upload with Supadata transcript extraction. TikTok/Instagram URLs → Supadata gets spoken transcript → Gemini parses recipe. TikTok oEmbed caption as free fallback. Remove the upload UI entirely.

**Tech Stack:** Supadata Transcript API, TikTok oEmbed, Gemini 2.5 Flash, Next.js App Router, next-intl.

---

### Task 1: Add Supadata transcript + oEmbed fallback to video module

**Files:**
- Modify: `src/lib/ai/video.ts`

**Context:** This file handles all video URL processing. Currently TikTok and Instagram URLs throw immediate errors at lines 340-350. We need to replace those throws with actual transcript extraction via Supadata, with a TikTok oEmbed caption fallback.

**Step 1: Add the Supadata transcript fetcher function**

After the `parseYouTubeViaTranscript` function (after line 275), add this new function:

```typescript
async function fetchSupadataTranscript(url: string): Promise<{ transcript: string; metadata: { title?: string } }> {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) throw new Error('SUPADATA_API_KEY is not set')

  const res = await fetch(`https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(url)}`, {
    headers: { 'x-api-key': apiKey },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Supadata API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
    throw new Error('No transcript available for this video')
  }

  const transcript = data.content.map((s: { text: string }) => s.text).join(' ')
  return { transcript, metadata: {} }
}
```

**Step 2: Add the TikTok oEmbed caption fallback function**

After the function above, add:

```typescript
async function fetchTikTokCaption(url: string): Promise<string> {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('TikTok oEmbed failed')

  const data = await res.json()
  const caption = data.title || ''
  if (caption.length < 50) {
    throw new Error('Caption too short to extract a recipe')
  }
  return caption
}
```

**Step 3: Replace TikTok/Instagram throw blocks in `parseVideoRecipe`**

In `parseVideoRecipe` (starts at line 338), replace lines 339-350 (the two throw blocks for TikTok and Instagram) with:

```typescript
  // TikTok and Instagram: extract transcript via Supadata, fallback to oEmbed caption
  if (isTikTokUrl(url) || isInstagramUrl(url)) {
    // Primary: Supadata transcript API
    try {
      const { transcript, metadata } = await fetchSupadataTranscript(url)
      const prompt = buildTranscriptPrompt(transcript, metadata)

      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      })

      const response = result.response.text()
      const parsed = JSON.parse(response)
      return recipeSchema.parse(parsed)
    } catch (supadataError) {
      console.error('Supadata transcript failed:', supadataError)
    }

    // Fallback for TikTok: oEmbed caption
    if (isTikTokUrl(url)) {
      try {
        const caption = await fetchTikTokCaption(url)
        return await parseRecipeFromText(caption)
      } catch (oembedError) {
        console.error('TikTok oEmbed fallback failed:', oembedError)
      }
    }

    throw new Error(
      'Could not extract recipe from this video. Try pasting the recipe text directly.',
    )
  }
```

**Step 4: Add parseRecipeFromText helper**

We need a helper that calls Gemini to parse recipe text (reusing the same logic as the API route's `parseRecipe`). Since `parseRecipe` is in `gemini.ts` and already exported, we can import it. Add this import at the top of video.ts (after the existing imports):

```typescript
import { parseRecipe as parseRecipeFromText } from '@/lib/ai/gemini'
```

**Step 5: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/lib/ai/video.ts
git commit -m "feat: add Supadata transcript + oEmbed fallback for TikTok/Instagram

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Remove upload UI from import page

**Files:**
- Modify: `src/app/[locale]/import/page.tsx`

**Context:** The import page currently has video upload UI (file input, upload button, upload handler). Since TikTok/Instagram links now work automatically via the API, all upload-related code should be removed. The page returns to its simpler form where ALL URLs (including TikTok/Instagram) just submit normally.

**Step 1: Revert the import page to its clean form**

Replace the entire file with:

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Import } from 'lucide-react'

export default function ImportPage() {
  const t = useTranslations()
  const router = useRouter()
  const { addRecipe } = useRecipes()

  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasText = text.trim().length > 0
  const hasUrl = url.trim().length > 0
  const isVideoLink = hasUrl && /youtube|youtu\.be|tiktok|instagram/.test(url)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

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

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (!hasText && !hasUrl)}
            >
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {isVideoLink ? t('import.importingVideo') : t('import.importing')}
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
```

**What was removed:**
- `useRef` import
- `Upload, Info` icon imports
- `videoFile` state and `fileInputRef` ref
- `isSocialVideoLink` computed value
- `handleSubmit` guard for social video links
- Entire `handleVideoUpload` function
- Upload card JSX (info card, hidden file input, upload button, maxFileSize hint)
- Submit button `isSocialVideoLink` disable condition
- `videoFile` check in loading text

**Step 2: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/[locale]/import/page.tsx
git commit -m "refactor: remove video upload UI, TikTok/IG links now work automatically

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Clean up API route (remove FormData handling)

**Files:**
- Modify: `src/app/api/ai/parse/route.ts`

**Context:** The FormData/video upload handling in the API route is no longer needed since TikTok/Instagram URLs are now processed server-side via transcript extraction. The route should go back to only accepting JSON.

**Step 1: Remove unused imports**

Change line 3 from:
```typescript
import { isVideoUrl, parseVideoRecipe, analyzeVideoWithGemini } from '@/lib/ai/video'
```
to:
```typescript
import { isVideoUrl, parseVideoRecipe } from '@/lib/ai/video'
```

Remove lines 5-7 entirely:
```typescript
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
```

**Step 2: Remove the FormData handling block**

In the POST function, remove the entire FormData block (everything from `// Handle video file upload (FormData)` through the closing `}` of the `if (contentType.includes('multipart/form-data'))` block, including the `contentType` variable). This is approximately lines 78-129.

The POST function should start directly with:
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, url } = requestSchema.parse(body)
```

**Step 3: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/api/ai/parse/route.ts
git commit -m "refactor: remove FormData handling, social video URLs handled via transcript API

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Clean up i18n keys

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Step 1: Remove upload-specific keys from en.json**

In `src/messages/en.json`, remove these 5 keys from the `"import"` object (lines 44-48):
```json
"videoUploadHint": "This platform requires you to save the video first. Upload it here and AI will watch it and extract the recipe.",
"uploadVideo": "Upload Video",
"maxFileSize": "Max file size: 50MB",
"fileTooLarge": "File is too large. Maximum size is 50MB.",
"uploadingVideo": "AI is watching your video and extracting the recipe..."
```

Keep the updated `"urlHint"` that mentions TikTok and Instagram — that is still accurate.

**Step 2: Remove upload-specific keys from ar.json**

In `src/messages/ar.json`, remove the same 5 keys from the `"import"` object (lines 44-48):
```json
"videoUploadHint": "هذه المنصة تتطلب حفظ الفيديو أولاً. ارفعه هنا وسيشاهده الذكاء الاصطناعي ويستخرج الوصفة.",
"uploadVideo": "رفع فيديو",
"maxFileSize": "الحد الأقصى لحجم الملف: ٥٠ ميجابايت",
"fileTooLarge": "الملف كبير جداً. الحد الأقصى هو ٥٠ ميجابايت.",
"uploadingVideo": "الذكاء الاصطناعي يشاهد الفيديو ويستخرج الوصفة..."
```

**Step 3: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/messages/en.json src/messages/ar.json
git commit -m "chore: remove unused video upload i18n keys

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Add SUPADATA_API_KEY to environment and deploy

**Step 1: Add the API key to .env.local**

The user needs to sign up at https://dash.supadata.ai?plan=basic (free, no credit card) and get their API key. Add to `.env.local`:

```
SUPADATA_API_KEY=<their-key>
```

**Step 2: Add the API key to Vercel environment variables**

```bash
vercel env add SUPADATA_API_KEY production
```

Enter the API key when prompted.

**Step 3: Verify the full build**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds.

**Step 4: Push and deploy**

```bash
git push origin feature/recipe-app-mvp
vercel --prod --yes
```

**Step 5: Test**

1. Go to https://farah-ai-two.vercel.app/en/import
2. Paste a TikTok recipe URL → click Import → recipe should be extracted automatically
3. Paste an Instagram reel URL → click Import → recipe should be extracted automatically
4. Paste a YouTube URL → should still work as before
5. Paste recipe text → should still work as before
