import { z } from 'zod'

export const ingredientSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  category: z.string().min(1),
})

export const stepSchema = z.object({
  order: z.number().int().min(1),
  instruction: z.string().min(1),
  instructionAr: z.string().optional(),
  duration: z.number().min(0).optional(),
})

export const nutritionSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).optional(),
})

export const recipeSchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  description: z.string().min(1),
  descriptionAr: z.string().optional(),
  image: z.string().optional(),
  servings: z.number().int().min(1),
  prepTime: z.number().min(0),
  cookTime: z.number().min(0),
  cuisine: z.string().optional(),
  tags: z.array(z.string()),
  ingredients: z.array(ingredientSchema),
  steps: z.array(stepSchema),
  nutrition: nutritionSchema.optional(),
})
