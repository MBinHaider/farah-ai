# Automatic TikTok/Instagram Link Processing — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make TikTok and Instagram recipe links work automatically — paste a link, get a recipe. No manual video upload needed.

**Architecture:** Use Supadata transcript API to extract spoken words from TikTok/Instagram videos, then feed the transcript to the existing Gemini recipe parser. Falls back to TikTok oEmbed caption (free) and then to error message.

**Tech Stack:** Supadata Transcript API, TikTok oEmbed API, Gemini 2.5 Flash, Next.js App Router.

---

## Problem

The current video upload approach requires users to manually save a video from TikTok/Instagram, then upload it. This is clunky. Users want to paste a link and get a recipe — the same experience as YouTube.

## Solution

Replace the manual upload flow with automatic transcript extraction:

1. User pastes TikTok or Instagram link → clicks Import
2. Server calls Supadata API to get the video's spoken transcript
3. Transcript is fed to existing Gemini recipe parser (same as YouTube transcripts)
4. Recipe is created and user is redirected

## API Details

### Supadata Transcript API

**Endpoint:** `GET https://api.supadata.ai/v1/transcript?url=<VIDEO_URL>`

**Headers:** `x-api-key: <SUPADATA_API_KEY>`

**Response:**
```json
{
  "lang": "en",
  "availableLangs": ["en"],
  "content": [
    { "text": "Today we're making...", "offset": 100, "duration": 2080 },
    { "text": "First add two cups of flour", "offset": 2180, "duration": 1500 }
  ]
}
```

Works for both TikTok and Instagram Reels. Same endpoint.

### TikTok oEmbed API (free fallback)

**Endpoint:** `GET https://www.tiktok.com/oembed?url=<TIKTOK_URL>`

**Response includes:** `title` field with the video caption text. Recipe creators often put recipes in captions.

## Fallback Chain

```
TikTok/Instagram URL detected
    |
    v
Try Supadata transcript API
    |-- Success -> join segments -> parseRecipe via Gemini -> done
    |-- Fail (rate limit, API down, etc.)
    v
TikTok only: try oEmbed caption
    |-- Success + caption > 100 chars -> parseRecipe via Gemini -> done
    |-- Fail or too short
    v
Show error: "Could not extract recipe. Try pasting the text directly."
```

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/ai/video.ts` | Replace TikTok/IG `throw` blocks with Supadata transcript calls + oEmbed fallback |
| `src/app/[locale]/import/page.tsx` | Remove upload card UI, remove videoFile state, remove handleVideoUpload, remove isSocialVideoLink |
| `src/app/api/ai/parse/route.ts` | Remove FormData handling (no longer needed), remove fs/os/path imports |
| `src/messages/en.json` | Remove upload-specific keys (videoUploadHint, uploadVideo, maxFileSize, fileTooLarge, uploadingVideo) |
| `src/messages/ar.json` | Same removals |
| `.env.local` | Add `SUPADATA_API_KEY` |

## Technical Details

### Video Module (`video.ts`)

New function `parseSocialVideoRecipe(url: string)`:
1. Call Supadata transcript API with the URL
2. Join all `content[].text` segments into a full transcript string
3. Call existing `buildTranscriptPrompt(transcript, metadata)` with the transcript
4. Parse with Gemini (same as YouTube transcript flow)
5. Return validated recipe

Fallback for TikTok: call oEmbed API, use `title` as caption text, feed to `parseRecipe()`.

### Import Page (`import/page.tsx`)

Revert to simpler state:
- Remove `videoFile`, `fileInputRef`, `isSocialVideoLink`
- Remove `handleVideoUpload` function
- Remove the conditional upload card JSX
- Remove submit button `isSocialVideoLink` disable
- Remove handleSubmit guard for social URLs
- TikTok/Instagram URLs now just flow through normal handleSubmit → API → recipe

### API Route (`route.ts`)

Remove the FormData block since we no longer need file uploads for this feature:
- Remove `writeFile, unlink` imports
- Remove `tmpdir, join` imports
- Remove the `multipart/form-data` content-type check and entire FormData handling block
- Keep `analyzeVideoWithGemini` import (still used for YouTube yt-dlp path)

## Environment Variables

```
SUPADATA_API_KEY=<get from dash.supadata.ai>
```

Free tier: 100 requests/month. No credit card required to start.

## What We Reuse (No Changes)

- `buildTranscriptPrompt()` — already formats transcripts for Gemini
- `parseRecipe()` — existing Gemini text parser
- `recipeSchema` — validates parsed recipe
- YouTube flow — completely unchanged
- Text paste and regular URL flows — unchanged
