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
- steps (array): Each with { order, instruction, instructionAr, duration, actions, ingredientsUsed }
  - duration is optional, in minutes
  - actions (array): Break the instruction into small discrete sub-actions. Each with { text, textAr }
    - Example: "Slice beef into thin strips" then "Marinate with soy sauce and pepper" then "Set aside"
  - ingredientsUsed (array, optional): Ingredients specifically used in THIS step. Each with { name, nameAr, quantity }
    - quantity is a display string like "2 tbsp" or "500g"
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
- steps (array): Each with { order, instruction, instructionAr, duration, actions, ingredientsUsed }
  - Write clear, actionable steps in both English and Arabic
  - Include duration in minutes where relevant
  - actions (array): Break each step into small discrete sub-actions. Each with { text, textAr }
  - ingredientsUsed (array, optional): Ingredients specifically used in THIS step. Each with { name, nameAr, quantity }
- nutrition (object): { calories, protein, carbs, fat, fiber } per serving (estimate)

Make the recipe practical, well-balanced, and delicious.`
}

export function buildTranscriptPrompt(
  transcript: string,
  metadata?: { title?: string; description?: string },
): string {
  const metaBlock = metadata
    ? `Video title: "${metadata.title ?? 'Unknown'}"\nVideo description: "${metadata.description ?? ''}"\n\n`
    : ''

  return `You are a recipe parser. The following is a transcript from a cooking video. Extract the recipe and return it as structured JSON.

${metaBlock}Since this is spoken content from a video, you may need to:
- Infer exact quantities when the speaker says things like "a handful" or "some"
- Identify ingredients from context even if not explicitly listed
- Determine cooking times from verbal cues like "until golden" or "for a few minutes"
- Organize scattered instructions into logical steps

Return a JSON object with these fields:
- title (string): Recipe name in English
- titleAr (string): Recipe name in Arabic
- description (string): Brief description in English
- descriptionAr (string): Brief description in Arabic
- servings (number): Number of servings (estimate from context, default 4)
- prepTime (number): Preparation time in minutes (estimate if not stated)
- cookTime (number): Cooking time in minutes (estimate if not stated)
- cuisine (string): Cuisine type (e.g., "Italian", "Middle Eastern")
- tags (string[]): Relevant tags
- ingredients (array): Each with { name, nameAr, quantity, unit, category }
  - category must be one of: produce, protein, dairy, grain, spice, oil, sweetener, other
  - Estimate quantities based on spoken instructions
- steps (array): Each with { order, instruction, instructionAr, duration, actions, ingredientsUsed }
  - duration is optional, in minutes
  - actions (array): Break the instruction into small discrete sub-actions. Each with { text, textAr }
  - ingredientsUsed (array, optional): Ingredients specifically used in THIS step. Each with { name, nameAr, quantity }
- nutrition (object): { calories, protein, carbs, fat, fiber } per serving (estimate)

Provide both English and Arabic translations for all text fields.

Transcript:
"""
${transcript}
"""`
}
