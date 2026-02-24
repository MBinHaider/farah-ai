import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
// youtube-transcript package fails on data center IPs (Vercel) because YouTube
// blocks HTML scraping from non-residential IPs. We use the InnerTube API directly
// which presents as an Android client and is not blocked.
import { recipeSchema } from '@/lib/schemas'
import { buildTranscriptPrompt } from '@/lib/ai/prompts'
import { execSync } from 'child_process'
import { unlinkSync, existsSync, readdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { z } from 'zod'

type ParsedRecipe = z.infer<typeof recipeSchema>

const YOUTUBE_PATTERNS = [
  /youtube\.com\/shorts\//,
  /youtube\.com\/watch/,
  /youtu\.be\//,
]

const TIKTOK_PATTERNS = [
  /tiktok\.com\//,
]

const INSTAGRAM_PATTERNS = [
  /instagram\.com\/(p|reel|reels)\//,
]

export function isVideoUrl(url: string): boolean {
  return [...YOUTUBE_PATTERNS, ...TIKTOK_PATTERNS, ...INSTAGRAM_PATTERNS].some((p) => p.test(url))
}

function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_PATTERNS.some((p) => p.test(url))
}

function isTikTokUrl(url: string): boolean {
  return TIKTOK_PATTERNS.some((p) => p.test(url))
}

function isInstagramUrl(url: string): boolean {
  return INSTAGRAM_PATTERNS.some((p) => p.test(url))
}

async function downloadVideo(url: string): Promise<{ path: string; cleanup: () => void }> {
  const prefix = `recipe-video-${Date.now()}`
  const filepath = join(tmpdir(), `${prefix}.mp4`)

  try {
    execSync(
      `yt-dlp -f "best[filesize<50M]/best[height<=720]" --no-playlist --max-filesize 50M -o "${filepath}" "${url}"`,
      { timeout: 60000, stdio: 'pipe' },
    )
  } catch {
    try {
      execSync(
        `yt-dlp -f "worst" --no-playlist -o "${filepath}" "${url}"`,
        { timeout: 60000, stdio: 'pipe' },
      )
    } catch {
      throw new Error('Video download failed')
    }
  }

  if (existsSync(filepath)) {
    return { path: filepath, cleanup: () => { try { unlinkSync(filepath) } catch {} } }
  }

  const tmpDir = tmpdir()
  const files = readdirSync(tmpDir).filter((f) => f.startsWith(prefix))
  if (files.length > 0) {
    const actualPath = join(tmpDir, files[0])
    return { path: actualPath, cleanup: () => { try { unlinkSync(actualPath) } catch {} } }
  }

  throw new Error('Video download failed')
}

function getMimeType(filepath: string): string {
  if (filepath.endsWith('.webm')) return 'video/webm'
  if (filepath.endsWith('.mkv')) return 'video/x-matroska'
  return 'video/mp4'
}

async function waitForProcessing(fileManager: GoogleAIFileManager, fileName: string): Promise<void> {
  let file = await fileManager.getFile(fileName)
  let attempts = 0
  while (file.state === FileState.PROCESSING && attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    file = await fileManager.getFile(fileName)
    attempts++
  }
  if (file.state === FileState.FAILED) {
    throw new Error('Video processing failed on Gemini')
  }
  if (file.state !== FileState.ACTIVE) {
    throw new Error('Video processing timed out')
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?.*v=([^&]+)/,
    /youtube\.com\/shorts\/([^/?]+)/,
    /youtu\.be\/([^/?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}


const CONSENT_COOKIES = 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk2NDcwMTcxMjQaAmVuIAEaBgiA_LyuBg'
const WEB_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function parseTranscriptXml(xml: string): string[] {
  const decodeEntities = (s: string) => s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, ' ')

  if (xml.includes('<p ')) {
    return [...xml.matchAll(/<p [^>]*>([\s\S]*?)<\/p>/g)]
      .map((m) =>
        [...m[1].matchAll(/<s[^>]*>([^<]*)<\/s>/g)]
          .map((w) => decodeEntities(w[1]))
          .join('')
          .trim(),
      )
      .filter(Boolean)
  }
  return [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) => decodeEntities(m[1]).trim())
    .filter(Boolean)
}

async function fetchYouTubePage(videoId: string): Promise<{ html: string; sessionCookies: string }> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': WEB_UA, 'Accept-Language': 'en-US,en;q=0.9', 'Cookie': CONSENT_COOKIES },
  })
  if (!res.ok) throw new Error('Failed to fetch YouTube page')
  const html = await res.text()
  const setCookies = res.headers.getSetCookie?.() ?? []
  const sessionCookies = [CONSENT_COOKIES, ...setCookies.map((c: string) => c.split(';')[0])].join('; ')
  return { html, sessionCookies }
}

function extractVideoDescription(html: string): string {
  const parts: string[] = []

  // Extract title
  const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]*)"/)
    ?? html.match(/"title":"([^"]*)"/)
  if (titleMatch?.[1]) parts.push(`Title: ${titleMatch[1]}`)

  // Extract description from meta tag
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)
  if (descMatch?.[1]) parts.push(`Description: ${descMatch[1]}`)

  // Extract structured description from ytInitialData (contains the full description)
  const fullDescMatch = html.match(/"attributedDescription":\{"content":"((?:[^"\\]|\\.)*)"/)

  if (fullDescMatch?.[1]) {
    const desc = fullDescMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
    parts.push(`Full description:\n${desc}`)
  }

  // Extract chapter markers if present
  const chaptersMatch = html.match(/"macroMarkersListItemRenderer".*?"title".*?"simpleText":"([^"]*)"/)
  if (chaptersMatch) {
    const chapterMatches = [...html.matchAll(/"macroMarkersListItemRenderer":\{"title":\{"simpleText":"([^"]*)"\}/g)]
    if (chapterMatches.length > 0) {
      parts.push('Chapters: ' + chapterMatches.map((m) => m[1]).join(', '))
    }
  }

  return parts.join('\n\n')
}

async function fetchTranscriptViaInnerTube(videoId: string): Promise<{ transcript: string; metadata: { title?: string; description?: string } }> {
  // Step 1: Fetch the YouTube watch page (works from data center IPs with consent cookies)
  const { html, sessionCookies } = await fetchYouTubePage(videoId)

  // Extract metadata from the page
  const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]*)"/)
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)
  const metadata = {
    title: titleMatch?.[1]?.replace(/ - YouTube$/, ''),
    description: descMatch?.[1],
  }

  // Step 2: Try InnerTube ANDROID API with session cookies
  const visitorDataMatch = html.match(/"visitorData":"([^"]+)"/)
  const visitorData = visitorDataMatch?.[1]

  const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; Android 13)',
      'Cookie': sessionCookies,
      ...(visitorData ? { 'X-Goog-Visitor-Id': visitorData } : {}),
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'ANDROID', clientVersion: '19.09.37', androidSdkVersion: 33,
          hl: 'en', gl: 'US', ...(visitorData ? { visitorData } : {}),
        },
      },
      videoId, contentCheckOk: true, racyCheckOk: true,
    }),
  })

  if (playerRes.ok) {
    const playerData = await playerRes.json()
    const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (captionTracks?.length) {
      const track = captionTracks.find((t: { languageCode: string }) => t.languageCode === 'en')
        ?? captionTracks[0]
      const transcriptRes = await fetch(track.baseUrl)
      if (transcriptRes.ok) {
        const xml = await transcriptRes.text()
        const segments = parseTranscriptXml(xml)
        if (segments.length) {
          return { transcript: segments.join(' '), metadata }
        }
      }
    }
  }

  // Step 3: InnerTube failed — extract description from the HTML page as fallback
  // Cooking videos often have the full recipe in the description
  const videoDescription = extractVideoDescription(html)
  if (videoDescription.length > 100) {
    return { transcript: videoDescription, metadata }
  }

  throw new Error('Could not extract transcript or description from video')
}

async function parseYouTubeViaTranscript(url: string): Promise<ParsedRecipe> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new Error('Could not extract video ID from URL')

  const { transcript, metadata } = await fetchTranscriptViaInnerTube(videoId)
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
}

export async function analyzeVideoWithGemini(videoPath: string): Promise<ParsedRecipe> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const fileManager = new GoogleAIFileManager(apiKey)
  const uploadResult = await fileManager.uploadFile(videoPath, {
    mimeType: getMimeType(videoPath),
    displayName: 'recipe-video',
  })

  await waitForProcessing(fileManager, uploadResult.file.name)

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are watching a cooking video. Carefully observe everything that happens in the video — the ingredients used, quantities, cooking techniques, timing, and steps.

Extract a complete recipe from this video and return it as structured JSON.

Return a JSON object with these fields:
- title (string): Recipe name in English
- titleAr (string): Recipe name in Arabic
- description (string): Brief description in English
- descriptionAr (string): Brief description in Arabic
- servings (number): Number of servings (estimate from video context)
- prepTime (number): Preparation time in minutes
- cookTime (number): Cooking time in minutes
- cuisine (string): Cuisine type (e.g., "Italian", "Middle Eastern")
- tags (string[]): Relevant tags
- ingredients (array): Each with { name, nameAr, quantity, unit, category }
  - category must be one of: produce, protein, dairy, grain, spice, oil, sweetener, other
  - Estimate quantities based on what you see in the video
- steps (array): Each with { order, instruction, instructionAr, duration }
  - duration is optional, in minutes
  - Describe each step based on what happens in the video
- nutrition (object): { calories, protein, carbs, fat, fiber } per serving (estimate)

Provide both English and Arabic translations for all text fields.
Pay close attention to what ingredients are added, how they are prepared, and the cooking methods used.`

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  })

  const response = result.response.text()
  const parsed = JSON.parse(response)
  return recipeSchema.parse(parsed)
}

export async function parseVideoRecipe(url: string): Promise<ParsedRecipe> {
  // TikTok and Instagram require authentication — can't download server-side
  if (isTikTokUrl(url)) {
    throw new Error(
      'TikTok videos require login to access. Please copy the recipe text from the video description and paste it in the text field instead.',
    )
  }

  if (isInstagramUrl(url)) {
    throw new Error(
      'Instagram posts require login to access. Please copy the recipe text from the caption and paste it in the text field instead.',
    )
  }

  // YouTube: try yt-dlp multimodal first, fall back to transcript
  if (isYouTubeUrl(url)) {
    try {
      const { path: videoPath, cleanup } = await downloadVideo(url)
      try {
        return await analyzeVideoWithGemini(videoPath)
      } finally {
        cleanup()
      }
    } catch {
      // yt-dlp not available (e.g., Vercel serverless) — fall back to transcript
      try {
        return await parseYouTubeViaTranscript(url)
      } catch (transcriptError) {
        const detail = transcriptError instanceof Error ? transcriptError.message : String(transcriptError)
        console.error('Transcript fallback failed:', detail)
        throw new Error(
          `Could not process this video (${detail}). Please copy the recipe text from the video description and paste it in the text field instead.`,
        )
      }
    }
  }

  throw new Error('Unsupported video platform')
}
