import { NextRequest, NextResponse } from 'next/server'
import { parseRecipe } from '@/lib/ai/gemini'
import { z } from 'zod'

const requestSchema = z.object({
  text: z.string().optional(),
  url: z.string().optional(),
})

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

    let rawText = text || ''

    if (url) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'RecipeAI/1.0' },
      })
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Could not fetch URL. Try pasting the recipe text directly.' },
          { status: 400 },
        )
      }
      rawText = await response.text()
      rawText = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      rawText = rawText.slice(0, 5000)
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
