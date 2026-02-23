export function buildParsePrompt(rawText: string): string {
  return `You are a recipe parser. Extract the recipe from the following text and return it as structured JSON.

Return a JSON object with these fields:
- title (string): Recipe name in English
- titleAr (string): Recipe name in Arabic
- description (string): Brief description in English
- descriptionAr (string): Brief description in Arabic
- servings (number): Number of servings (default 4 if not specified)
- prepTime (number): Preparation time in minutes (estimate if not specified)
- cookTime (number): Cooking time in minutes (estimate if not specified)
- cuisine (string): Cuisine type (e.g., "Italian", "Middle Eastern")
- tags (string[]): Relevant tags
- ingredients (array): Each with { name, nameAr, quantity, unit, category }
  - category must be one of: produce, protein, dairy, grain, spice, oil, sweetener, other
- steps (array): Each with { order, instruction, instructionAr, duration }
  - duration is optional, in minutes
- nutrition (object): { calories, protein, carbs, fat, fiber } per serving (estimate)

Provide both English and Arabic translations for all text fields.

Raw text to parse:
"""
${rawText}
"""`
}

export function buildGeneratePrompt(description: string): string {
  return `You are a professional chef and recipe creator. Generate a complete recipe based on the following description. Return structured JSON.

User's description: "${description}"

Return a JSON object with these fields:
- title (string): Recipe name in English
- titleAr (string): Recipe name in Arabic
- description (string): Brief description in English (1-2 sentences)
- descriptionAr (string): Brief description in Arabic (1-2 sentences)
- servings (number): Number of servings
- prepTime (number): Preparation time in minutes
- cookTime (number): Cooking time in minutes
- cuisine (string): Cuisine type
- tags (string[]): Relevant tags
- ingredients (array): Each with { name, nameAr, quantity, unit, category }
  - category must be one of: produce, protein, dairy, grain, spice, oil, sweetener, other
  - Use standard measurements (g, ml, cup, tbsp, tsp, pcs)
- steps (array): Each with { order, instruction, instructionAr, duration }
  - Write clear, actionable steps in both English and Arabic
  - Include duration in minutes where relevant
- nutrition (object): { calories, protein, carbs, fat, fiber } per serving (estimate)

Make the recipe practical, well-balanced, and delicious.`
}
