import { GoogleGenerativeAI } from '@google/generative-ai'
import { recipeSchema } from '@/lib/schemas'
import { buildParsePrompt, buildGeneratePrompt } from './prompts'
import type { z } from 'zod'

type ParsedRecipe = z.infer<typeof recipeSchema>

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
}

async function callGemini(prompt: string, temperature: number): Promise<string> {
  const model = getModel()
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  })
  return result.response.text()
}

export async function parseRecipe(rawText: string): Promise<ParsedRecipe> {
  const prompt = buildParsePrompt(rawText)
  const response = await callGemini(prompt, 0.3)
  const parsed = JSON.parse(response)
  return recipeSchema.parse(parsed)
}

export async function generateRecipe(description: string): Promise<ParsedRecipe> {
  const prompt = buildGeneratePrompt(description)
  const response = await callGemini(prompt, 0.7)
  const parsed = JSON.parse(response)
  return recipeSchema.parse(parsed)
}
