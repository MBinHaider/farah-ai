# Video Upload for TikTok/Instagram Recipes — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users upload saved TikTok/Instagram recipe videos so Gemini AI can watch them and extract recipes.

**Architecture:** Hybrid approach — YouTube URLs continue working via transcript API; TikTok/Instagram URLs trigger a helpful prompt with a video upload button; uploaded videos go through the existing Gemini video analysis pipeline.

**Tech Stack:** Next.js App Router, Gemini 2.5 Flash (multimodal), FormData file upload, existing `analyzeVideoWithGemini()` function.

---

## Problem

TikTok and Instagram block automated video downloads. The current code throws immediate errors ("require login to access") when users paste these URLs. Users cannot import recipes from these platforms.

## Solution

When a user pastes a TikTok or Instagram URL:
1. Client-side detection shows a friendly message explaining the limitation
2. A video upload button appears so the user can upload the saved video from their phone
3. The uploaded video is sent to the API, saved to `/tmp`, and processed by Gemini's multimodal analysis
4. The existing `analyzeVideoWithGemini()` function handles the rest

## UX Flow

```
User pastes TikTok/IG URL
    |
    v
Client detects platform via regex (already exists)
    |
    v
Show info card: "Save the video from TikTok/Instagram, then upload it here"
    + File upload button (accepts video/*)
    |
    v
User uploads saved video file
    |
    v
FormData POST to /api/ai/parse with video file
    |
    v
API saves to /tmp -> analyzeVideoWithGemini(path) -> recipe JSON
    |
    v
Client saves recipe -> redirect to /recipes/{id}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/app/[locale]/import/page.tsx` | Add TikTok/IG detection card with upload button, FormData upload logic |
| `src/app/api/ai/parse/route.ts` | Accept FormData with video file, write to /tmp, call `analyzeVideoWithGemini` |
| `src/lib/ai/video.ts` | Export `analyzeVideoWithGemini` (currently private), keep TikTok/IG URL blocks for direct URL attempts |
| `src/messages/en.json` | Add i18n keys for upload prompt |
| `src/messages/ar.json` | Add Arabic i18n keys for upload prompt |

## Technical Details

### Import Page (`import/page.tsx`)
- Detect TikTok/Instagram URL via existing `isVideoLink` regex
- Show an info card with Upload Video button when detected
- File input: `accept="video/*"`, max 50MB client-side validation
- Upload via `FormData` with the video file
- Show progress: "AI is watching the video..."

### API Route (`api/ai/parse/route.ts`)
- Check if request is `multipart/form-data` (video upload) vs JSON (text/URL)
- Read the file from FormData, write to `/tmp/recipe-video-{timestamp}.mp4`
- Call `analyzeVideoWithGemini(tempPath)` (same function used for YouTube)
- Clean up temp file after processing
- Keep `maxDuration = 60` (sufficient for upload + Gemini processing)

### Video Module (`lib/ai/video.ts`)
- Export `analyzeVideoWithGemini` so the API route can call it directly with uploaded files
- Keep the TikTok/IG URL blocking in `parseVideoRecipe()` as a safety net (API still rejects direct URL attempts)

### i18n Keys
- `import.videoUploadHint`: "This platform requires you to save the video first. Upload it here and AI will watch it."
- `import.uploadVideo`: "Upload Video"
- `import.maxFileSize`: "Max file size: 50MB"

## Constraints
- Vercel serverless `/tmp` is writable, ~500MB, cleaned between invocations
- Vercel request body limit: configurable, needs `export const config` for larger uploads
- Gemini File API accepts up to 2GB; we cap at 50MB for practical UX
- `maxDuration: 60` is sufficient for video upload + Gemini processing

## What We Reuse (No Changes)
- `analyzeVideoWithGemini()` — uploads to Gemini File API, waits for processing, extracts recipe
- `waitForProcessing()` — polls Gemini until video is ready
- `getMimeType()` — determines video MIME type
- `recipeSchema` — validates the parsed recipe
- Client-side recipe saving via `addRecipe()` + IndexedDB
