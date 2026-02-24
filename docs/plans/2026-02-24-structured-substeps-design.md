# Structured Sub-Steps Design

## Problem

Cooking steps are monolithic paragraphs — walls of text. In cooking mode, users must mentally parse which ingredients they need and what actions to take. Example:

> "Slice the beef fillet into thin strips. Marinate with 2 tbsp soy sauce, ½ tsp black pepper, 1 tsp garlic powder, and 1 tsp onion powder. Set aside."

This is three distinct actions with four ingredients, but rendered as one blob.

## Solution

Extend the `Step` type with optional structured fields. The AI breaks each step into discrete **actions** and lists the **ingredients used** in that step. The cook page renders them as:

1. **Ingredient checklist** — what you need for this step (checkable)
2. **Numbered actions** — bite-sized instructions
3. **Animated icon** — contextual cooking animation (already implemented)

Old recipes without structured data fall back to the current plain text view.

## Data Model

```typescript
interface StepAction {
  text: string
  textAr?: string
}

interface StepIngredient {
  name: string
  nameAr?: string
  quantity: string   // "2 tbsp" — display string, not parsed
}

interface Step {
  order: number
  instruction: string          // full text (kept as fallback)
  instructionAr?: string
  duration?: number
  actions?: StepAction[]       // NEW
  ingredientsUsed?: StepIngredient[]  // NEW
}
```

Both new fields are optional — backward compatible.

## AI Prompt Changes

All three prompt builders add this to the step schema:

```
- steps (array): Each with { order, instruction, instructionAr, duration, actions, ingredientsUsed }
  - actions (array): Break the step into small discrete actions. Each with { text, textAr }
  - ingredientsUsed (array, optional): Ingredients needed for THIS step. Each with { name, nameAr, quantity }
  - duration is optional, in minutes
```

**Files**: `src/lib/ai/prompts.ts` (all 3 functions)

## Schema Validation

`src/lib/schemas.ts` — Add:

```typescript
const stepActionSchema = z.object({
  text: z.string().min(1),
  textAr: nullableString,
})

const stepIngredientSchema = z.object({
  name: z.string().min(1),
  nameAr: nullableString,
  quantity: z.string().default(''),
})

// stepSchema gets two new optional arrays
export const stepSchema = z.object({
  order: z.number().int().min(1),
  instruction: z.string().min(1),
  instructionAr: nullableString,
  duration: nullableNumber,
  actions: z.array(stepActionSchema).optional().default([]),
  ingredientsUsed: z.array(stepIngredientSchema).optional().default([]),
})
```

## TypeScript Types

`src/types/recipe.ts` — Add `StepAction` and `StepIngredient` interfaces, extend `Step`.

## Cook Page Rendering

`src/app/[locale]/cook/[id]/page.tsx`:

- If `step.actions?.length > 0` → render ingredient checklist + numbered actions
- Else → render `step.instruction` as plain text (current behavior)
- Keyword detection for animated icons still uses `step.instruction`

## What Stays Unchanged

- Recipe card, recipe detail page, recipe list
- Database (Dexie) — schema-free, accepts new fields automatically
- Existing saved recipes — fallback rendering, no re-processing
- Generate API route handler — just calls `generateRecipe()`
- Parse API route handler — just calls `parseRecipe()` or `parseVideoRecipe()`
