import { z } from 'zod'

// Helper: accept null as undefined for optional fields (Gemini often returns null)
const nullableString = z.string().nullable().optional().transform((v) => v ?? undefined)
const nullableNumber = z.number().nullable().optional().transform((v) => v ?? undefined)

export const ingredientSchema = z.object({
  name: z.string().min(1),
  nameAr: nullableString,
  quantity: z.number().min(0).nullable().transform((v) => v ?? 0),
  unit: z.string().nullable().transform((v) => v ?? ''),
  category: z.string().nullable().transform((v) => v ?? 'other'),
})

export const stepSchema = z.object({
  order: z.number().int().min(1),
  instruction: z.string().min(1),
  instructionAr: nullableString,
  duration: nullableNumber,
})

export const nutritionSchema = z.object({
  calories: z.number().min(0).nullable().transform((v) => v ?? 0),
  protein: z.number().min(0).nullable().transform((v) => v ?? 0),
  carbs: z.number().min(0).nullable().transform((v) => v ?? 0),
  fat: z.number().min(0).nullable().transform((v) => v ?? 0),
  fiber: z.number().min(0).nullable().optional().transform((v) => v ?? undefined),
})

export const recipeSchema = z.object({
  title: z.string().min(1),
  titleAr: nullableString,
  description: z.string().min(1),
  descriptionAr: nullableString,
  image: nullableString,
  servings: z.number().int().min(1),
  prepTime: z.number().min(0),
  cookTime: z.number().min(0),
  cuisine: nullableString,
  tags: z.array(z.string()).default([]),
  ingredients: z.array(ingredientSchema).default([]),
  steps: z.array(stepSchema).default([]),
  nutrition: nutritionSchema.nullable().optional().transform((v) => v ?? undefined),
})
