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
  rating?: number
}

export interface Ingredient {
  name: string
  nameAr?: string
  quantity: number
  unit: string
  category: string
}

export interface StepAction {
  text: string
  textAr?: string
}

export interface StepIngredient {
  name: string
  nameAr?: string
  quantity: string
}

export interface Step {
  order: number
  instruction: string
  instructionAr?: string
  duration?: number
  actions?: StepAction[]
  ingredientsUsed?: StepIngredient[]
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}
