# Video Upload for TikTok/Instagram Recipes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users upload saved TikTok/Instagram recipe videos so Gemini AI can watch them and extract recipes.

**Architecture:** Hybrid approach — YouTube URLs keep working via transcript API. TikTok/Instagram URLs show a friendly upload prompt instead of an error. Uploaded videos go through the existing `analyzeVideoWithGemini()` pipeline.

**Tech Stack:** Next.js 16 App Router, Google Generative AI (Gemini 2.5 Flash), FormData file upload, Zod validation, next-intl i18n.

---

### Task 1: Add i18n keys for video upload UI

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Step 1: Add English i18n keys**

In `src/messages/en.json`, add these keys inside the `"import"` object (after the existing `"error"` key at line 43):

```json
"videoUploadHint": "This platform requires you to save the video first. Upload it here and AI will watch it and extract the recipe.",
"uploadVideo": "Upload Video",
"maxFileSize": "Max file size: 50MB",
"fileTooLarge": "File is too large. Maximum size is 50MB.",
"uploadingVideo": "AI is watching your video and extracting the recipe..."
```

Also update the existing `"urlHint"` key to mention all platforms:

```json
"urlHint": "Supports YouTube, TikTok, and Instagram videos, plus recipe websites"
```

**Step 2: Add Arabic i18n keys**

In `src/messages/ar.json`, add these keys inside the `"import"` object (after the existing `"error"` key at line 43):

```json
"videoUploadHint": "هذه المنصة تتطلب حفظ الفيديو أولاً. ارفعه هنا وسيشاهده الذكاء الاصطناعي ويستخرج الوصفة.",
"uploadVideo": "رفع فيديو",
"maxFileSize": "الحد الأقصى لحجم الملف: ٥٠ ميجابايت",
"fileTooLarge": "الملف كبير جداً. الحد الأقصى هو ٥٠ ميجابايت.",
"uploadingVideo": "الذكاء الاصطناعي يشاهد الفيديو ويستخرج الوصفة..."
```

Also update the existing `"urlHint"` key:

```json
"urlHint": "يدعم فيديوهات يوتيوب وتيك توك وإنستغرام ومواقع الوصفات"
```

**Step 3: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add src/messages/en.json src/messages/ar.json
git commit -m "feat: add i18n keys for video upload UI"
```

---

### Task 2: Export `analyzeVideoWithGemini` from video module

**Files:**
- Modify: `src/lib/ai/video.ts:277`

**Step 1: Export the function**

In `src/lib/ai/video.ts`, change line 277 from:

```typescript
async function analyzeVideoWithGemini(videoPath: string): Promise<ParsedRecipe> {
```

to:

```typescript
export async function analyzeVideoWithGemini(videoPath: string): Promise<ParsedRecipe> {
```

That's the only change. The function already does everything we need:
- Uploads video to Gemini File API
- Waits for processing
- Sends to Gemini with recipe extraction prompt
- Returns validated `ParsedRecipe`

**Step 2: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds. No other file imports this function yet, so nothing breaks.

**Step 3: Commit**

```bash
git add src/lib/ai/video.ts
git commit -m "feat: export analyzeVideoWithGemini for direct file uploads"
```

---

### Task 3: Add video file upload handling to API route

**Files:**
- Modify: `src/app/api/ai/parse/route.ts`

**Context:** The current API route only accepts JSON `{ text?, url? }`. We need it to also accept `FormData` with a video file. The route must detect the content type and branch accordingly.

**Step 1: Add file upload imports and helper**

At the top of `src/app/api/ai/parse/route.ts`, update the imports. Change line 3 from:

```typescript
import { isVideoUrl, parseVideoRecipe } from '@/lib/ai/video'
```

to:

```typescript
import { isVideoUrl, parseVideoRecipe, analyzeVideoWithGemini } from '@/lib/ai/video'
```

Add these imports after the existing ones:

```typescript
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
```

**Step 2: Add the video file processing logic**

At the beginning of the `POST` function body (line 77, after `try {`), add this block BEFORE the existing `const body = await request.json()` line:

```typescript
    // Handle video file upload (FormData)
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('video') as File | null

      if (!file) {
        return NextResponse.json(
          { error: 'No video file provided' },
          { status: 400 },
        )
      }

      // Validate file size (50MB max)
      const MAX_SIZE = 50 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'File is too large. Maximum size is 50MB.' },
          { status: 400 },
        )
      }

      // Validate MIME type
      if (!file.type.startsWith('video/')) {
        return NextResponse.json(
          { error: 'File must be a video' },
          { status: 400 },
        )
      }

      // Write to temp file
      const tempPath = join(tmpdir(), `recipe-upload-${Date.now()}.mp4`)
      try {
        const bytes = await file.arrayBuffer()
        await writeFile(tempPath, Buffer.from(bytes))
        const recipe = await analyzeVideoWithGemini(tempPath)
        return NextResponse.json(recipe)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Video processing failed'
        console.error('Video upload processing error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
      } finally {
        try { await unlink(tempPath) } catch {}
      }
    }
```

**Step 3: Configure body size limit for Next.js App Router**

At the bottom of the file (after the `POST` function), add this route segment config to allow larger uploads. The App Router uses `export const` for route configuration:

```typescript
export const config = {
  api: {
    bodyParser: false,
  },
}
```

**Important note:** In Next.js App Router (not Pages Router), the body size for route handlers is not limited by `bodyParser` config the same way. The App Router handles `FormData` natively. However, Vercel serverless has a default 4.5MB body limit. For files >4.5MB, we need to set the `maxBodyLength` via `vercel.json` or accept the default. For now, keep the 50MB client-side validation and let Vercel's default handle it. If users hit the limit, we can add a `vercel.json` config later.

Actually, remove the `config` export — it's a Pages Router pattern. In App Router, the body limit is handled differently. Just rely on client-side validation for now.

**Step 4: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add src/app/api/ai/parse/route.ts
git commit -m "feat: add video file upload handling to parse API route"
```

---

### Task 4: Add video upload UI to import page

**Files:**
- Modify: `src/app/[locale]/import/page.tsx`

**Context:** This is the main UI change. When a user pastes a TikTok or Instagram URL, we show an info card with an upload button instead of letting them submit and get an error. The existing URL input, text paste, and YouTube URL flow remain unchanged.

**Step 1: Add new state and refs**

In `src/app/[locale]/import/page.tsx`, add `useRef` to the React import (line 1):

```typescript
import { useState, useRef } from 'react'
```

Add the `Upload` icon to the lucide import (line 12):

```typescript
import { Loader2, Import, Upload, Info } from 'lucide-react'
```

After the existing state declarations (after line 22), add:

```typescript
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
```

Add a computed value after `isVideoLink` (after line 26):

```typescript
  const isSocialVideoLink = hasUrl && /tiktok|instagram/.test(url)
```

**Step 2: Add the video file upload handler**

After the `handleSubmit` function (after line 62), add this new function:

```typescript
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
      setError(err instanceof Error ? err.message : t('import.error'))
    } finally {
      setLoading(false)
      setVideoFile(null)
    }
  }
```

**Step 3: Modify the submit button behavior**

In the existing `handleSubmit` function, add a guard at the very top (after `setLoading(true)`) to prevent submitting TikTok/Instagram URLs directly:

After line 31 (`setLoading(true)`), add:

```typescript
      // Don't submit TikTok/Instagram URLs directly — guide user to upload
      if (isSocialVideoLink) {
        setLoading(false)
        return
      }
```

**Step 4: Add the video upload UI card**

In the JSX, add a new section between the URL input section and the error display. Find the closing `</div>` of the URL input section (after the `<p>` with urlHint, around line 112) and add this block AFTER it:

```tsx
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
```

**Step 5: Update the loading text**

In the submit button's loading state (around line 128), update the condition to also show video upload text:

Change:

```tsx
                  {isVideoLink ? t('import.importingVideo') : t('import.importing')}
```

to:

```tsx
                  {videoFile ? t('import.uploadingVideo') : isVideoLink ? t('import.importingVideo') : t('import.importing')}
```

**Step 6: Disable the submit button when a social video link is detected**

Update the submit button's `disabled` prop to also disable when it's a social video link (since users should use the upload button instead):

Change:

```tsx
              disabled={loading || (!hasText && !hasUrl)}
```

to:

```tsx
              disabled={loading || (!hasText && !hasUrl) || isSocialVideoLink}
```

**Step 7: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds with no errors.

**Step 8: Commit**

```bash
git add src/app/[locale]/import/page.tsx
git commit -m "feat: add video upload UI for TikTok/Instagram recipes"
```

---

### Task 5: Manual testing and deploy

**Step 1: Start dev server and test**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run dev`

Test these scenarios:
1. **YouTube URL** — paste a YouTube recipe URL → should still work as before (transcript/description extraction)
2. **TikTok URL** — paste `https://www.tiktok.com/@someone/video/123` → should show the info card with upload button, submit button should be disabled
3. **Instagram URL** — paste `https://www.instagram.com/reel/abc123/` → should show the info card with upload button, submit button should be disabled
4. **Text paste** — paste recipe text → should still work as before
5. **Regular URL** — paste a recipe website URL → should still work as before
6. **Clear URL** — after pasting a TikTok URL, clear it → info card should disappear, submit should re-enable

**Step 2: Commit any fixes and push**

```bash
git push origin feature/recipe-app-mvp
```

**Step 3: Deploy to Vercel**

```bash
vercel --prod --yes
```

Expected: Deploy succeeds, live at https://farah-ai-two.vercel.app
