export interface Recipe {
  id: string
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  image?: string
  servings: number
  prepTime: number
  cookTime: number
  cuisine?: string
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
  nutrition?: NutritionInfo
  source: 'import' | 'generated' | 'manual'
  sourceUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface Ingredient {
  name: string
  nameAr?: string
  quantity: number
  unit: string
  category: string
}

export interface Step {
  order: number
  instruction: string
  instructionAr?: string
  duration?: number
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}
