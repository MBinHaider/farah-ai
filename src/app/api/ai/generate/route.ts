import { NextRequest, NextResponse } from 'next/server'
import { generateRecipe } from '@/lib/ai/gemini'
import { z } from 'zod'

const requestSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description } = requestSchema.parse(body)
    const recipe = await generateRecipe(description)
    return NextResponse.json(recipe)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 422 },
      )
    }
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}
