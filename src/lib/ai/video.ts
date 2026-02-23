import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { recipeSchema } from '@/lib/schemas'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { z } from 'zod'

type ParsedRecipe = z.infer<typeof recipeSchema>

const VIDEO_PLATFORMS = [
  /youtube\.com\/shorts\//,
  /youtube\.com\/watch/,
  /youtu\.be\//,
  /tiktok\.com\//,
  /instagram\.com\/(p|reel|reels)\//,
]

export function isVideoUrl(url: string): boolean {
  return VIDEO_PLATFORMS.some((pattern) => pattern.test(url))
}

async function downloadVideo(url: string): Promise<{ path: string; cleanup: () => void }> {
  const filename = `recipe-video-${Date.now()}.mp4`
  const filepath = join(tmpdir(), filename)

  try {
    execSync(
      `yt-dlp -f "best[filesize<50M]/best[height<=720]" --no-playlist --max-filesize 50M -o "${filepath}" "${url}"`,
      { timeout: 60000, stdio: 'pipe' },
    )
  } catch {
    // Fallback: try with lower quality
    execSync(
      `yt-dlp -f "worst" --no-playlist -o "${filepath}" "${url}"`,
      { timeout: 60000, stdio: 'pipe' },
    )
  }

  if (!existsSync(filepath)) {
    // yt-dlp may add extension
    const webmPath = filepath.replace('.mp4', '.webm')
    const mkvPath = filepath.replace('.mp4', '.mkv')
    if (existsSync(webmPath)) {
      return { path: webmPath, cleanup: () => { try { unlinkSync(webmPath) } catch {} } }
    }
    if (existsSync(mkvPath)) {
      return { path: mkvPath, cleanup: () => { try { unlinkSync(mkvPath) } catch {} } }
    }
    throw new Error('Video download failed')
  }

  return { path: filepath, cleanup: () => { try { unlinkSync(filepath) } catch {} } }
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

export async function parseVideoRecipe(url: string): Promise<ParsedRecipe> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  // Download video
  const { path: videoPath, cleanup } = await downloadVideo(url)

  try {
    // Upload to Gemini
    const fileManager = new GoogleAIFileManager(apiKey)
    const uploadResult = await fileManager.uploadFile(videoPath, {
      mimeType: getMimeType(videoPath),
      displayName: 'recipe-video',
    })

    // Wait for processing
    await waitForProcessing(fileManager, uploadResult.file.name)

    // Ask Gemini to analyze the video and extract recipe
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

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
  } finally {
    cleanup()
  }
}
