# Structured Sub-Steps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Break monolithic cooking steps into discrete sub-actions with ingredient checklists, so the cook page becomes a guided experience rather than a wall of text.

**Architecture:** Extend the `Step` type with optional `actions[]` and `ingredientsUsed[]` arrays. Update AI prompts to produce structured data. Cook page renders structured data when present, falls back to plain text for old recipes.

**Tech Stack:** TypeScript, Zod, Next.js, next-intl, Tailwind CSS, Lucide React

---

### Task 1: Extend TypeScript Types

**Files:**
- Modify: `src/types/recipe.ts:31-36`

**Step 1: Add StepAction and StepIngredient interfaces and extend Step**

Replace lines 31-36 of `src/types/recipe.ts` with:

```typescript
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
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors (new fields are optional, no consumers break)

**Step 3: Commit**

```bash
git add src/types/recipe.ts
git commit -m "feat: extend Step type with actions and ingredientsUsed"
```

---

### Task 2: Extend Zod Schema Validation

**Files:**
- Modify: `src/lib/schemas.ts:22-27`
- Modify: `src/test/schemas.test.ts`

**Step 1: Write failing tests for new schema fields**

Add to the bottom of `src/test/schemas.test.ts`:

```typescript
describe('stepSchema — structured sub-steps', () => {
  it('accepts step with actions array', () => {
    const step = {
      order: 1,
      instruction: 'Slice beef and marinate',
      actions: [
        { text: 'Slice beef into thin strips' },
        { text: 'Marinate with soy sauce', textAr: 'تبّل بصوص الصويا' },
      ],
    }
    const result = stepSchema.safeParse(step)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.actions).toHaveLength(2)
      expect(result.data.actions![1].textAr).toBe('تبّل بصوص الصويا')
    }
  })

  it('accepts step with ingredientsUsed array', () => {
    const step = {
      order: 1,
      instruction: 'Marinate beef',
      ingredientsUsed: [
        { name: 'Beef fillet', nameAr: 'فيليه لحم', quantity: '500g' },
        { name: 'Soy sauce', quantity: '2 tbsp' },
      ],
    }
    const result = stepSchema.safeParse(step)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ingredientsUsed).toHaveLength(2)
    }
  })

  it('defaults actions and ingredientsUsed to empty arrays', () => {
    const step = { order: 1, instruction: 'Boil water' }
    const result = stepSchema.safeParse(step)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.actions).toEqual([])
      expect(result.data.ingredientsUsed).toEqual([])
    }
  })

  it('rejects action with empty text', () => {
    const step = {
      order: 1,
      instruction: 'Do stuff',
      actions: [{ text: '' }],
    }
    const result = stepSchema.safeParse(step)
    expect(result.success).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/schemas.test.ts`
Expected: 4 new tests FAIL (stepSchema doesn't know about actions/ingredientsUsed yet)

**Step 3: Update the Zod schema**

In `src/lib/schemas.ts`, add two new schemas before `stepSchema` (before line 22), then extend `stepSchema`:

Add before `export const stepSchema`:

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
```

Then replace the existing `stepSchema` (lines 22-27) with:

```typescript
export const stepSchema = z.object({
  order: z.number().int().min(1),
  instruction: z.string().min(1),
  instructionAr: nullableString,
  duration: nullableNumber,
  actions: z.array(stepActionSchema).optional().default([]),
  ingredientsUsed: z.array(stepIngredientSchema).optional().default([]),
})
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/schemas.test.ts`
Expected: ALL tests PASS (including the 4 new ones + existing 5)

**Step 5: Commit**

```bash
git add src/lib/schemas.ts src/test/schemas.test.ts
git commit -m "feat: add actions and ingredientsUsed to step schema with tests"
```

---

### Task 3: Update AI Prompts

**Files:**
- Modify: `src/lib/ai/prompts.ts:16-17,46-48,83-84`

**Step 1: Update buildParsePrompt step definition**

In `src/lib/ai/prompts.ts`, replace line 16-17:

```
- steps (array): Each with { order, instruction, instructionAr, duration }
  - duration is optional, in minutes
```

with:

```
- steps (array): Each with { order, instruction, instructionAr, duration, actions, ingredientsUsed }
  - duration is optional, in minutes
  - actions (array): Break the instruction into small discrete sub-actions. Each with { text, textAr }
    - Example: "Slice beef into thin strips" then "Marinate with soy sauce and pepper" then "Set aside"
  - ingredientsUsed (array, optional): Ingredients specifically used in THIS step. Each with { name, nameAr, quantity }
    - quantity is a display string like "2 tbsp" or "500g"
```

**Step 2: Update buildGeneratePrompt step definition**

Replace lines 46-48:

```
- steps (array): Each with { order, instruction, instructionAr, duration }
  - Write clear, actionable steps in both English and Arabic
  - Include duration in minutes where relevant
```

with:

```
- steps (array): Each with { order, instruction, instructionAr, duration, actions, ingredientsUsed }
  - Write clear, actionable steps in both English and Arabic
  - Include duration in minutes where relevant
  - actions (array): Break each step into small discrete sub-actions. Each with { text, textAr }
  - ingredientsUsed (array, optional): Ingredients specifically used in THIS step. Each with { name, nameAr, quantity }
```

**Step 3: Update buildTranscriptPrompt step definition**

Replace lines 83-84:

```
- steps (array): Each with { order, instruction, instructionAr, duration }
  - duration is optional, in minutes
```

with:

```
- steps (array): Each with { order, instruction, instructionAr, duration, actions, ingredientsUsed }
  - duration is optional, in minutes
  - actions (array): Break the instruction into small discrete sub-actions. Each with { text, textAr }
  - ingredientsUsed (array, optional): Ingredients specifically used in THIS step. Each with { name, nameAr, quantity }
```

**Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/lib/ai/prompts.ts
git commit -m "feat: update AI prompts to request structured sub-steps"
```

---

### Task 4: Add i18n Keys

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Step 1: Add English keys**

In `src/messages/en.json`, inside the `"cook"` section, add these keys (after `"backToRecipe": "Back to Recipe"`):

```json
"youllNeed": "You'll need",
"actions": "Actions"
```

**Step 2: Add Arabic keys**

In `src/messages/ar.json`, inside the `"cook"` section, add these keys (after `"backToRecipe": "العودة للوصفة"`):

```json
"youllNeed": "ستحتاج إلى",
"actions": "الخطوات"
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/messages/en.json src/messages/ar.json
git commit -m "feat: add i18n keys for structured sub-steps"
```

---

### Task 5: Update Cook Page Rendering

**Files:**
- Modify: `src/app/[locale]/cook/[id]/page.tsx:486-497`

This is the main visual change. The step content area (lines 486-497) currently shows just the step number circle and a single paragraph. We replace it with structured rendering when `step.actions` has content.

**Step 1: Add Square and CircleCheck imports**

In the imports at line 9-13, add `Square` and `CircleCheck` to the lucide-react import:

```typescript
import {
  X, ChevronLeft, ChevronRight, Play, Pause, Timer,
  Flame, Droplets, ChefHat, Sparkles, Clock, UtensilsCrossed,
  CookingPot, Check, Share2, ArrowLeft, Star, Square, CircleCheck,
} from 'lucide-react'
```

**Step 2: Add ingredientChecked state**

After the `shareMessage` state declaration (line 219), add:

```typescript
const [ingredientChecked, setIngredientChecked] = useState<Record<string, boolean>>({})
```

**Step 3: Reset ingredient checks when step changes**

In the existing `useEffect` that resets timer when step changes (around line 247), add at the top of the effect body:

```typescript
setIngredientChecked({})
```

**Step 4: Replace the step content block**

Replace the block from the `{/* Step number circle */}` comment through the `{/* Step instruction */}` paragraph (lines 491-497):

```typescript
          {/* Step number circle */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
            {step.order}
          </div>
```

becomes:

```tsx
          {/* Step number circle */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
            {step.order}
          </div>

          {/* Structured sub-steps or plain instruction */}
          {step.actions && step.actions.length > 0 ? (
            <div className="flex w-full max-w-lg flex-col gap-4">
              {/* Ingredient checklist */}
              {step.ingredientsUsed && step.ingredientsUsed.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('youllNeed')}
                  </p>
                  <ul className="space-y-2">
                    {step.ingredientsUsed.map((ing, idx) => {
                      const key = `${currentStep}-${idx}`
                      const checked = ingredientChecked[key] ?? false
                      const ingName = locale === 'ar' && ing.nameAr ? ing.nameAr : ing.name
                      return (
                        <li key={idx}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 text-start"
                            onClick={() =>
                              setIngredientChecked((prev) => ({ ...prev, [key]: !checked }))
                            }
                          >
                            {checked ? (
                              <CircleCheck className="h-5 w-5 shrink-0 text-primary" />
                            ) : (
                              <Square className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                            )}
                            <span className={checked ? 'text-muted-foreground line-through' : ''}>
                              <span className="font-medium">{ingName}</span>
                              {ing.quantity && (
                                <span className="text-muted-foreground"> · {ing.quantity}</span>
                              )}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Numbered actions */}
              <ol className="space-y-3">
                {step.actions.map((action, idx) => {
                  const actionText = locale === 'ar' && action.textAr ? action.textAr : action.text
                  return (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {idx + 1}
                      </span>
                      <p className="text-lg leading-relaxed pt-0.5">{actionText}</p>
                    </li>
                  )
                })}
              </ol>
            </div>
          ) : (
            <p className="max-w-lg text-center text-2xl leading-relaxed">{instruction}</p>
          )}
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 6: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/app/[locale]/cook/[id]/page.tsx
git commit -m "feat: render structured sub-steps with ingredient checklists in cook mode"
```

---

### Task 6: Build, Push, Deploy

**Step 1: Final build**

Run: `npm run build`
Expected: Build succeeds

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Push and deploy**

```bash
git push origin feature/recipe-app-mvp
vercel --prod --yes
```

Expected: Deployment succeeds
