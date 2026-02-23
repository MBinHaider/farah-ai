import { NextRequest, NextResponse } from 'next/server'
import { parseRecipe } from '@/lib/ai/gemini'
import { isVideoUrl, parseVideoRecipe } from '@/lib/ai/video'
import { z } from 'zod'

const requestSchema = z.object({
  text: z.string().optional(),
  url: z.string().optional(),
})

function extractMetaContent(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1]
  }
  return ''
}

function extractJsonLd(html: string): string {
  const matches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)
  if (!matches) return ''
  for (const match of matches) {
    const content = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '')
    if (content.includes('Recipe') || content.includes('recipe')) {
      return content.slice(0, 3000)
    }
  }
  return ''
}

function extractFromHtml(html: string): string {
  const parts: string[] = []

  // 1. Extract JSON-LD structured data (best source for recipe sites)
  const jsonLd = extractJsonLd(html)
  if (jsonLd) {
    parts.push(`Structured recipe data: ${jsonLd}`)
  }

  // 2. Extract meta tags (useful for YouTube, social media, and recipe sites)
  const title = extractMetaContent(html, 'og:title') || extractMetaContent(html, 'title')
  const description = extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description')

  if (title) parts.push(`Title: ${title}`)
  if (description) parts.push(`Description: ${description}`)

  // 3. Extract page title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (titleMatch?.[1] && !title) {
    parts.push(`Page title: ${titleMatch[1]}`)
  }

  // 4. Strip tags and get body text
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (bodyText.length > 100) {
    parts.push(`Page content: ${bodyText.slice(0, 4000)}`)
  }

  return parts.join('\n\n').slice(0, 6000)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, url } = requestSchema.parse(body)

    if (!text && !url) {
      return NextResponse.json(
        { error: 'Either text or url must be provided' },
        { status: 400 },
      )
    }

    // Video URL: download and use Gemini multimodal to watch the video
    if (url && isVideoUrl(url)) {
      try {
        const recipe = await parseVideoRecipe(url)
        return NextResponse.json(recipe)
      } catch (videoError) {
        const message = videoError instanceof Error ? videoError.message : 'Video processing failed'
        // Return user-facing errors directly instead of falling through to weak metadata extraction
        if (
          message.includes('require login') ||
          message.includes('require authentication') ||
          message.includes('not available in this environment') ||
          message.includes('Video download failed')
        ) {
          return NextResponse.json({ error: message }, { status: 400 })
        }
        console.error('Video processing failed, falling back to metadata extraction:', videoError)
        // For other errors, fall through to HTML metadata extraction
      }
    }

    let rawText = text || ''

    if (url) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
          'Accept': 'text/html',
        },
        redirect: 'follow',
      })
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Could not fetch URL. Try pasting the recipe text directly.' },
          { status: 400 },
        )
      }
      const html = await response.text()
      rawText = extractFromHtml(html)

      if (rawText.length < 50) {
        return NextResponse.json(
          { error: 'Could not extract enough content from this URL. Try pasting the recipe text directly.' },
          { status: 400 },
        )
      }
    }

    const recipe = await parseRecipe(rawText)
    return NextResponse.json(recipe)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid recipe data', details: error.issues },
        { status: 422 },
      )
    }
    console.error('Parse error:', error)
    return NextResponse.json({ error: 'Failed to parse recipe' }, { status: 500 })
  }
}
