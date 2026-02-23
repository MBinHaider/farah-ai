# Recipe App Clone — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a free, bilingual (AR/EN) web app that uses Google Gemini AI to import, generate, and organize recipes — with meal planning and grocery list generation.

**Architecture:** Next.js 14 App Router with server-side API routes proxying Gemini calls. All user data stored client-side in IndexedDB via Dexie.js. Bilingual UI via next-intl with full RTL support. shadcn/ui component library customized with a warm food-themed palette.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Dexie.js, Google Gemini 1.5 Flash, next-intl, Zod, Vitest, React Testing Library

**Design Doc:** `docs/plans/2026-02-23-recipe-app-clone-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.env.local`, `.env.example`, `.gitignore`

**Step 1: Create Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. This scaffolds into the current directory.

**Step 2: Verify the dev server starts**

Run:
```bash
npm run dev
```

Expected: Server starts on http://localhost:3000, shows Next.js welcome page. Stop with Ctrl+C.

**Step 3: Create environment files**

Create `.env.example`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Create `.env.local`:
```
GEMINI_API_KEY=
```

Note: The user will need to get a free Gemini API key from https://aistudio.google.com/apikey and paste it into `.env.local`.

**Step 4: Update .gitignore**

Append to `.gitignore`:
```
.env.local
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with TypeScript and Tailwind"
```

---

## Task 2: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install runtime dependencies**

Run:
```bash
npm install dexie dexie-react-hooks next-intl zod @google/generative-ai uuid
```

- `dexie` + `dexie-react-hooks`: IndexedDB wrapper with React hooks
- `next-intl`: i18n for Next.js App Router
- `zod`: Schema validation for AI responses
- `@google/generative-ai`: Google Gemini SDK
- `uuid`: Generate recipe IDs

**Step 2: Install dev dependencies**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event fake-indexeddb @types/uuid
```

- `vitest` + `@vitejs/plugin-react` + `jsdom`: Test runner
- `@testing-library/*`: Component testing
- `fake-indexeddb`: Mock IndexedDB for tests

**Step 3: Verify install succeeded**

Run:
```bash
npm ls dexie next-intl zod @google/generative-ai
```

Expected: Shows installed versions with no errors.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install core dependencies (dexie, next-intl, zod, gemini, vitest)"
```

---

## Task 3: Setup Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (add test script)
- Create: `src/test/example.test.ts`

**Step 1: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 2: Create test setup file**

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
```

**Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Write a smoke test**

Create `src/test/example.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('works', () => {
    expect(1 + 1).toBe(2)
  })
})
```

**Step 5: Run the test**

Run:
```bash
npm test
```

Expected: 1 test passes.

**Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts src/test/example.test.ts package.json
git commit -m "feat: configure vitest with jsdom, RTL, and fake-indexeddb"
```

---

## Task 4: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

**Step 1: Run shadcn init**

Run:
```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes
- `src/` directory: Yes (should auto-detect)
- React Server Components: Yes
- Import alias for components: `@/components`
- Import alias for utils: `@/lib/utils`

**Step 2: Install initial components**

Run:
```bash
npx shadcn@latest add button card input textarea label badge dialog dropdown-menu separator tabs toast
```

These are the base components we'll need across the app.

**Step 3: Verify by adding a button to the home page**

Temporarily modify `src/app/page.tsx`:
```tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Button>Hello Recipe App</Button>
    </main>
  )
}
```

**Step 4: Verify it renders**

Run:
```bash
npm run dev
```

Expected: Page shows a styled button. Stop dev server.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize shadcn/ui with base components"
```

---

## Task 5: Custom Theme — Food-Friendly Palette

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Update CSS variables for warm food palette**

Replace the `:root` and `.dark` CSS variable blocks in `src/app/globals.css` with:

```css
@layer base {
  :root {
    --background: 40 33% 98%;       /* warm white */
    --foreground: 30 10% 15%;       /* warm dark */
    --card: 40 33% 96%;
    --card-foreground: 30 10% 15%;
    --popover: 40 33% 98%;
    --popover-foreground: 30 10% 15%;
    --primary: 142 40% 40%;         /* earthy green */
    --primary-foreground: 0 0% 100%;
    --secondary: 36 70% 55%;        /* warm amber */
    --secondary-foreground: 30 10% 15%;
    --muted: 40 20% 92%;
    --muted-foreground: 30 10% 45%;
    --accent: 36 70% 55%;
    --accent-foreground: 30 10% 15%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 30 15% 88%;
    --input: 30 15% 88%;
    --ring: 142 40% 40%;
    --radius: 0.625rem;
  }

  .dark {
    --background: 30 10% 10%;
    --foreground: 40 20% 92%;
    --card: 30 10% 12%;
    --card-foreground: 40 20% 92%;
    --popover: 30 10% 10%;
    --popover-foreground: 40 20% 92%;
    --primary: 142 45% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 36 60% 45%;
    --secondary-foreground: 40 20% 92%;
    --muted: 30 10% 18%;
    --muted-foreground: 40 15% 60%;
    --accent: 36 60% 45%;
    --accent-foreground: 40 20% 92%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 30 10% 22%;
    --input: 30 10% 22%;
    --ring: 142 45% 50%;
  }
}
```

**Step 2: Verify colors render**

Run `npm run dev`, check the page. The button should have an earthy green tone.

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: apply warm food-friendly color palette (green/amber theme)"
```

---

## Task 6: TypeScript Types & Zod Schemas

**Files:**
- Create: `src/types/recipe.ts`
- Create: `src/types/meal-plan.ts`
- Create: `src/types/grocery.ts`
- Create: `src/lib/schemas.ts`
- Create: `src/test/schemas.test.ts`

**Step 1: Write the failing test for Zod schemas**

Create `src/test/schemas.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { recipeSchema, ingredientSchema, stepSchema } from '@/lib/schemas'

describe('recipeSchema', () => {
  it('validates a complete recipe', () => {
    const recipe = {
      title: 'Pasta',
      description: 'Simple pasta',
      servings: 4,
      prepTime: 10,
      cookTime: 20,
      tags: ['italian'],
      ingredients: [
        { name: 'Pasta', quantity: 500, unit: 'g', category: 'grain' },
      ],
      steps: [
        { order: 1, instruction: 'Boil water' },
      ],
    }
    const result = recipeSchema.safeParse(recipe)
    expect(result.success).toBe(true)
  })

  it('rejects recipe with missing title', () => {
    const recipe = {
      description: 'No title',
      servings: 4,
      prepTime: 10,
      cookTime: 20,
      tags: [],
      ingredients: [],
      steps: [],
    }
    const result = recipeSchema.safeParse(recipe)
    expect(result.success).toBe(false)
  })

  it('rejects recipe with zero servings', () => {
    const recipe = {
      title: 'Bad',
      description: 'Zero servings',
      servings: 0,
      prepTime: 10,
      cookTime: 20,
      tags: [],
      ingredients: [],
      steps: [],
    }
    const result = recipeSchema.safeParse(recipe)
    expect(result.success).toBe(false)
  })
})

describe('ingredientSchema', () => {
  it('accepts optional Arabic name', () => {
    const ingredient = { name: 'Salt', nameAr: 'ملح', quantity: 1, unit: 'tsp', category: 'spice' }
    expect(ingredientSchema.safeParse(ingredient).success).toBe(true)
  })

  it('rejects negative quantity', () => {
    const ingredient = { name: 'Salt', quantity: -1, unit: 'tsp', category: 'spice' }
    expect(ingredientSchema.safeParse(ingredient).success).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/test/schemas.test.ts
```

Expected: FAIL — module `@/lib/schemas` not found.

**Step 3: Create TypeScript types**

Create `src/types/recipe.ts`:
```typescript
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
```

Create `src/types/meal-plan.ts`:
```typescript
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealPlan {
  id: string
  weekStart: Date
  meals: PlannedMeal[]
}

export interface PlannedMeal {
  day: DayOfWeek
  slot: MealSlot
  recipeId: string
  servings: number
}
```

Create `src/types/grocery.ts`:
```typescript
export interface GroceryList {
  id: string
  mealPlanId: string
  items: GroceryItem[]
  createdAt: Date
}

export interface GroceryItem {
  name: string
  nameAr?: string
  quantity: number
  unit: string
  category: string
  checked: boolean
}
```

**Step 4: Create Zod schemas**

Create `src/lib/schemas.ts`:
```typescript
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
```

**Step 5: Run tests**

Run:
```bash
npm test -- src/test/schemas.test.ts
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/types/ src/lib/schemas.ts src/test/schemas.test.ts
git commit -m "feat: add TypeScript types and Zod validation schemas for recipes, meal plans, grocery lists"
```

---

## Task 7: Dexie.js Database Layer

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/test/db.test.ts`

**Step 1: Write failing tests for the database**

Create `src/test/db.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import type { Recipe } from '@/types/recipe'

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'test-1',
  title: 'Test Recipe',
  description: 'A test recipe',
  servings: 4,
  prepTime: 10,
  cookTime: 20,
  tags: ['test'],
  ingredients: [{ name: 'Flour', quantity: 200, unit: 'g', category: 'grain' }],
  steps: [{ order: 1, instruction: 'Mix ingredients' }],
  source: 'manual',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('db.recipes', () => {
  beforeEach(async () => {
    await db.recipes.clear()
  })

  it('adds and retrieves a recipe', async () => {
    const recipe = makeRecipe()
    await db.recipes.add(recipe)
    const retrieved = await db.recipes.get('test-1')
    expect(retrieved?.title).toBe('Test Recipe')
  })

  it('lists all recipes', async () => {
    await db.recipes.bulkAdd([
      makeRecipe({ id: 'r1', title: 'Recipe 1' }),
      makeRecipe({ id: 'r2', title: 'Recipe 2' }),
    ])
    const all = await db.recipes.toArray()
    expect(all).toHaveLength(2)
  })

  it('deletes a recipe', async () => {
    await db.recipes.add(makeRecipe())
    await db.recipes.delete('test-1')
    const retrieved = await db.recipes.get('test-1')
    expect(retrieved).toBeUndefined()
  })

  it('updates a recipe', async () => {
    await db.recipes.add(makeRecipe())
    await db.recipes.update('test-1', { title: 'Updated Title' })
    const retrieved = await db.recipes.get('test-1')
    expect(retrieved?.title).toBe('Updated Title')
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/test/db.test.ts
```

Expected: FAIL — module `@/lib/db` not found.

**Step 3: Create the database**

Create `src/lib/db.ts`:
```typescript
import Dexie, { type EntityTable } from 'dexie'
import type { Recipe } from '@/types/recipe'
import type { MealPlan } from '@/types/meal-plan'
import type { GroceryList } from '@/types/grocery'

interface UserPreferences {
  id: string
  locale: 'en' | 'ar'
  theme: 'light' | 'dark' | 'system'
}

const database = new Dexie('RecipeAppDB') as Dexie & {
  recipes: EntityTable<Recipe, 'id'>
  mealPlans: EntityTable<MealPlan, 'id'>
  groceryLists: EntityTable<GroceryList, 'id'>
  preferences: EntityTable<UserPreferences, 'id'>
}

database.version(1).stores({
  recipes: 'id, title, cuisine, source, createdAt',
  mealPlans: 'id, weekStart',
  groceryLists: 'id, mealPlanId, createdAt',
  preferences: 'id',
})

export { database as db }
```

**Step 4: Run tests**

Run:
```bash
npm test -- src/test/db.test.ts
```

Expected: All 4 tests pass.

**Step 5: Commit**

```bash
git add src/lib/db.ts src/test/db.test.ts
git commit -m "feat: add Dexie.js database with recipes, meal plans, grocery lists tables"
```

---

## Task 8: i18n Setup (next-intl)

**Files:**
- Create: `src/i18n/request.ts`
- Create: `src/i18n/routing.ts`
- Create: `src/messages/en.json`
- Create: `src/messages/ar.json`
- Create: `src/middleware.ts`
- Modify: `next.config.ts`
- Modify: `src/app/layout.tsx`

**Step 1: Create message files**

Create `src/messages/en.json`:
```json
{
  "common": {
    "appName": "Recipe AI",
    "home": "Home",
    "recipes": "Recipes",
    "import": "Import",
    "generate": "Generate",
    "plan": "Meal Plan",
    "grocery": "Grocery List",
    "settings": "Settings",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try Again",
    "offline": "You are offline"
  },
  "home": {
    "title": "My Recipes",
    "empty": "No recipes yet. Import or generate your first recipe!",
    "search": "Search recipes..."
  },
  "recipe": {
    "servings": "Servings",
    "prepTime": "Prep Time",
    "cookTime": "Cook Time",
    "ingredients": "Ingredients",
    "steps": "Steps",
    "nutrition": "Nutrition",
    "startCooking": "Start Cooking",
    "addRecipe": "Add Recipe"
  },
  "import": {
    "title": "Import Recipe",
    "pasteText": "Paste recipe text",
    "pasteUrl": "Or paste a URL",
    "importing": "AI is extracting your recipe...",
    "success": "Recipe imported!",
    "error": "Could not parse recipe. Try pasting the text directly."
  },
  "generate": {
    "title": "Generate Recipe",
    "placeholder": "Describe the dish you want (e.g., 'healthy chicken pasta for 2 people')",
    "generating": "AI is creating your recipe...",
    "success": "Recipe generated!"
  },
  "cook": {
    "step": "Step {current} of {total}",
    "next": "Next Step",
    "previous": "Previous",
    "done": "Done!",
    "timer": "{minutes} min"
  },
  "plan": {
    "title": "Meal Plan",
    "thisWeek": "This Week",
    "breakfast": "Breakfast",
    "lunch": "Lunch",
    "dinner": "Dinner",
    "snack": "Snack",
    "generateGroceryList": "Generate Grocery List"
  },
  "grocery": {
    "title": "Grocery List",
    "empty": "No items. Plan some meals first!",
    "allChecked": "All items checked!"
  },
  "settings": {
    "title": "Settings",
    "language": "Language",
    "theme": "Theme",
    "export": "Export Data",
    "importData": "Import Data",
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  }
}
```

Create `src/messages/ar.json`:
```json
{
  "common": {
    "appName": "وصفات AI",
    "home": "الرئيسية",
    "recipes": "الوصفات",
    "import": "استيراد",
    "generate": "إنشاء",
    "plan": "خطة الوجبات",
    "grocery": "قائمة المشتريات",
    "settings": "الإعدادات",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "loading": "جارٍ التحميل...",
    "error": "حدث خطأ ما",
    "retry": "حاول مرة أخرى",
    "offline": "أنت غير متصل"
  },
  "home": {
    "title": "وصفاتي",
    "empty": "لا توجد وصفات بعد. استورد أو أنشئ أول وصفة!",
    "search": "ابحث عن وصفات..."
  },
  "recipe": {
    "servings": "الحصص",
    "prepTime": "وقت التحضير",
    "cookTime": "وقت الطبخ",
    "ingredients": "المكونات",
    "steps": "الخطوات",
    "nutrition": "القيمة الغذائية",
    "startCooking": "ابدأ الطبخ",
    "addRecipe": "أضف وصفة"
  },
  "import": {
    "title": "استيراد وصفة",
    "pasteText": "الصق نص الوصفة",
    "pasteUrl": "أو الصق رابطاً",
    "importing": "الذكاء الاصطناعي يستخرج وصفتك...",
    "success": "تم استيراد الوصفة!",
    "error": "تعذر تحليل الوصفة. حاول لصق النص مباشرة."
  },
  "generate": {
    "title": "إنشاء وصفة",
    "placeholder": "صف الطبق الذي تريده (مثلاً: 'معكرونة صحية بالدجاج لشخصين')",
    "generating": "الذكاء الاصطناعي ينشئ وصفتك...",
    "success": "تم إنشاء الوصفة!"
  },
  "cook": {
    "step": "الخطوة {current} من {total}",
    "next": "الخطوة التالية",
    "previous": "السابقة",
    "done": "تم!",
    "timer": "{minutes} دقيقة"
  },
  "plan": {
    "title": "خطة الوجبات",
    "thisWeek": "هذا الأسبوع",
    "breakfast": "فطور",
    "lunch": "غداء",
    "dinner": "عشاء",
    "snack": "وجبة خفيفة",
    "generateGroceryList": "إنشاء قائمة المشتريات"
  },
  "grocery": {
    "title": "قائمة المشتريات",
    "empty": "لا توجد عناصر. خطط لبعض الوجبات أولاً!",
    "allChecked": "تم تحديد جميع العناصر!"
  },
  "settings": {
    "title": "الإعدادات",
    "language": "اللغة",
    "theme": "المظهر",
    "export": "تصدير البيانات",
    "importData": "استيراد البيانات",
    "light": "فاتح",
    "dark": "داكن",
    "system": "النظام"
  }
}
```

**Step 2: Create i18n configuration**

Create `src/i18n/routing.ts`:
```typescript
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
})
```

Create `src/i18n/request.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'en' | 'ar')) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

**Step 3: Create middleware**

Create `src/middleware.ts`:
```typescript
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/', '/(en|ar)/:path*'],
}
```

**Step 4: Update next.config.ts**

Replace `next.config.ts` contents with:
```typescript
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
```

**Step 5: Restructure app directory for locale routing**

Move `src/app/page.tsx` and `src/app/layout.tsx` to locale-based routing:

- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`
- Keep: `src/app/globals.css` and `src/app/layout.tsx` (root layout)

Root layout `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Recipe AI',
  description: 'AI-powered recipe organizer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
```

Locale layout `src/app/[locale]/layout.tsx`:
```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Inter, Cairo } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'ar')) {
    notFound()
  }

  const messages = await getMessages()
  const isRtl = locale === 'ar'
  const fontClass = isRtl ? cairo.variable : inter.variable

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <body className={`${fontClass} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

Locale page `src/app/[locale]/page.tsx`:
```tsx
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations('home')
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
    </main>
  )
}
```

**Step 6: Verify both locales work**

Run:
```bash
npm run dev
```

- Visit http://localhost:3000/en → shows "My Recipes"
- Visit http://localhost:3000/ar → shows "وصفاتي" in RTL layout

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: setup next-intl with Arabic/English locales and RTL support"
```

---

## Task 9: App Shell — Layout & Navigation

**Files:**
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/bottom-nav.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/theme-provider.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Step 1: Install next-themes for dark mode**

Run:
```bash
npm install next-themes
```

**Step 2: Create ThemeProvider**

Create `src/components/theme-provider.tsx`:
```tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**Step 3: Create Header component**

Create `src/components/layout/header.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { Button } from '@/components/ui/button'

export function Header() {
  const t = useTranslations('common')

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          {t('appName')}
        </Link>
        <nav className="hidden md:flex items-center gap-4">
          <NavLink href="/">{t('home')}</NavLink>
          <NavLink href="/import">{t('import')}</NavLink>
          <NavLink href="/generate">{t('generate')}</NavLink>
          <NavLink href="/plan">{t('plan')}</NavLink>
          <NavLink href="/grocery">{t('grocery')}</NavLink>
          <NavLink href="/settings">{t('settings')}</NavLink>
        </nav>
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`text-sm transition-colors hover:text-primary ${
        isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  )
}
```

Note: We need to also create the navigation helper. Create `src/i18n/routing.ts` update — add `Link`, `usePathname`, `useRouter` exports:

Update `src/i18n/routing.ts`:
```typescript
import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
})

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
```

**Step 4: Create BottomNav for mobile**

Create `src/components/layout/bottom-nav.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { Home, Import, Sparkles, Calendar, ShoppingCart } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, labelKey: 'home' },
  { href: '/import', icon: Import, labelKey: 'import' },
  { href: '/generate', icon: Sparkles, labelKey: 'generate' },
  { href: '/plan', icon: Calendar, labelKey: 'plan' },
  { href: '/grocery', icon: ShoppingCart, labelKey: 'grocery' },
] as const

export function BottomNav() {
  const t = useTranslations('common')
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 5: Update locale layout to use shell**

Update `src/app/[locale]/layout.tsx` to include Header, BottomNav, ThemeProvider:
```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Inter, Cairo } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'ar')) {
    notFound()
  }

  const messages = await getMessages()
  const isRtl = locale === 'ar'
  const fontClass = isRtl ? cairo.variable : inter.variable

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={`${fontClass} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <Header />
            <main className="container mx-auto px-4 pb-20 pt-4 md:pb-4">
              {children}
            </main>
            <BottomNav />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Step 6: Install lucide-react**

Run:
```bash
npm install lucide-react
```

**Step 7: Verify navigation renders**

Run `npm run dev`, check:
- Desktop: header nav links visible
- Mobile (resize browser): bottom tab bar visible
- Visit `/ar` — RTL layout, Arabic labels

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add app shell with header, bottom nav, dark mode, RTL layout"
```

---

## Task 10: Utility Functions — Serving Adjustment & Fractions

**Files:**
- Create: `src/lib/utils/servings.ts`
- Create: `src/test/servings.test.ts`

**Step 1: Write failing tests**

Create `src/test/servings.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { adjustQuantity, toFraction } from '@/lib/utils/servings'

describe('adjustQuantity', () => {
  it('scales quantity up', () => {
    expect(adjustQuantity(200, 4, 8)).toBe(400)
  })

  it('scales quantity down', () => {
    expect(adjustQuantity(200, 4, 2)).toBe(100)
  })

  it('returns same quantity for same servings', () => {
    expect(adjustQuantity(200, 4, 4)).toBe(200)
  })

  it('handles fractional results', () => {
    expect(adjustQuantity(1, 4, 6)).toBeCloseTo(1.5)
  })
})

describe('toFraction', () => {
  it('displays whole numbers as-is', () => {
    expect(toFraction(2)).toBe('2')
  })

  it('displays 0.5 as ½', () => {
    expect(toFraction(0.5)).toBe('½')
  })

  it('displays 0.25 as ¼', () => {
    expect(toFraction(0.25)).toBe('¼')
  })

  it('displays 0.75 as ¾', () => {
    expect(toFraction(0.75)).toBe('¾')
  })

  it('displays 0.333 as ⅓', () => {
    expect(toFraction(1 / 3)).toBe('⅓')
  })

  it('displays 0.667 as ⅔', () => {
    expect(toFraction(2 / 3)).toBe('⅔')
  })

  it('displays 1.5 as 1 ½', () => {
    expect(toFraction(1.5)).toBe('1 ½')
  })

  it('rounds non-standard fractions to 2 decimals', () => {
    expect(toFraction(1.37)).toBe('1.37')
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/test/servings.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement serving utilities**

Create `src/lib/utils/servings.ts`:
```typescript
export function adjustQuantity(
  baseQuantity: number,
  baseServings: number,
  targetServings: number,
): number {
  return (baseQuantity / baseServings) * targetServings
}

const FRACTION_MAP: [number, string][] = [
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
]

const TOLERANCE = 0.04

export function toFraction(value: number): string {
  if (Number.isInteger(value)) return String(value)

  const whole = Math.floor(value)
  const decimal = value - whole

  for (const [fraction, symbol] of FRACTION_MAP) {
    if (Math.abs(decimal - fraction) < TOLERANCE) {
      return whole > 0 ? `${whole} ${symbol}` : symbol
    }
  }

  return Number(value.toFixed(2)).toString()
}
```

**Step 4: Run tests**

Run:
```bash
npm test -- src/test/servings.test.ts
```

Expected: All 8 tests pass.

**Step 5: Commit**

```bash
git add src/lib/utils/servings.ts src/test/servings.test.ts
git commit -m "feat: add serving adjustment and fraction display utilities"
```

---

## Task 11: Grocery Aggregation Utility

**Files:**
- Create: `src/lib/utils/grocery.ts`
- Create: `src/test/grocery.test.ts`

**Step 1: Write failing tests**

Create `src/test/grocery.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { aggregateGroceryItems } from '@/lib/utils/grocery'
import type { Ingredient } from '@/types/recipe'

describe('aggregateGroceryItems', () => {
  it('combines same ingredient with same unit', () => {
    const meals = [
      { ingredients: [{ name: 'Flour', quantity: 200, unit: 'g', category: 'grain' }], servingsMultiplier: 1 },
      { ingredients: [{ name: 'Flour', quantity: 100, unit: 'g', category: 'grain' }], servingsMultiplier: 1 },
    ]
    const result = aggregateGroceryItems(meals)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(300)
  })

  it('keeps different ingredients separate', () => {
    const meals = [
      { ingredients: [{ name: 'Flour', quantity: 200, unit: 'g', category: 'grain' }], servingsMultiplier: 1 },
      { ingredients: [{ name: 'Sugar', quantity: 100, unit: 'g', category: 'sweetener' }], servingsMultiplier: 1 },
    ]
    const result = aggregateGroceryItems(meals)
    expect(result).toHaveLength(2)
  })

  it('applies servings multiplier', () => {
    const meals = [
      { ingredients: [{ name: 'Flour', quantity: 200, unit: 'g', category: 'grain' }], servingsMultiplier: 2 },
    ]
    const result = aggregateGroceryItems(meals)
    expect(result[0].quantity).toBe(400)
  })

  it('keeps same ingredient with different units separate', () => {
    const meals = [
      { ingredients: [{ name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy' }], servingsMultiplier: 1 },
      { ingredients: [{ name: 'Milk', quantity: 500, unit: 'ml', category: 'dairy' }], servingsMultiplier: 1 },
    ]
    const result = aggregateGroceryItems(meals)
    expect(result).toHaveLength(2)
  })

  it('sorts by category', () => {
    const meals = [
      {
        ingredients: [
          { name: 'Salt', quantity: 1, unit: 'tsp', category: 'spice' },
          { name: 'Chicken', quantity: 500, unit: 'g', category: 'protein' },
          { name: 'Tomato', quantity: 2, unit: 'pcs', category: 'produce' },
        ],
        servingsMultiplier: 1,
      },
    ]
    const result = aggregateGroceryItems(meals)
    const categories = result.map((item) => item.category)
    expect(categories).toEqual([...categories].sort())
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/test/grocery.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement grocery aggregation**

Create `src/lib/utils/grocery.ts`:
```typescript
import type { Ingredient } from '@/types/recipe'
import type { GroceryItem } from '@/types/grocery'

interface MealIngredients {
  ingredients: Ingredient[]
  servingsMultiplier: number
}

export function aggregateGroceryItems(meals: MealIngredients[]): GroceryItem[] {
  const map = new Map<string, GroceryItem>()

  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`
      const existing = map.get(key)

      if (existing) {
        existing.quantity += ing.quantity * meal.servingsMultiplier
      } else {
        map.set(key, {
          name: ing.name,
          nameAr: ing.nameAr,
          quantity: ing.quantity * meal.servingsMultiplier,
          unit: ing.unit,
          category: ing.category,
          checked: false,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category))
}
```

**Step 4: Run tests**

Run:
```bash
npm test -- src/test/grocery.test.ts
```

Expected: All 5 tests pass.

**Step 5: Commit**

```bash
git add src/lib/utils/grocery.ts src/test/grocery.test.ts
git commit -m "feat: add grocery item aggregation with serving multiplier and category sorting"
```

---

## Task 12: Gemini AI Service

**Files:**
- Create: `src/lib/ai/gemini.ts`
- Create: `src/lib/ai/prompts.ts`
- Create: `src/test/ai-prompts.test.ts`

**Step 1: Write tests for prompt construction**

Create `src/test/ai-prompts.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { buildParsePrompt, buildGeneratePrompt } from '@/lib/ai/prompts'

describe('buildParsePrompt', () => {
  it('includes the raw text in the prompt', () => {
    const prompt = buildParsePrompt('2 cups flour, 1 egg. Mix and bake.')
    expect(prompt).toContain('2 cups flour, 1 egg. Mix and bake.')
  })

  it('requests JSON output', () => {
    const prompt = buildParsePrompt('any recipe text')
    expect(prompt.toLowerCase()).toContain('json')
  })

  it('requests bilingual output', () => {
    const prompt = buildParsePrompt('any recipe text')
    expect(prompt).toContain('Arabic')
    expect(prompt).toContain('English')
  })
})

describe('buildGeneratePrompt', () => {
  it('includes the user description', () => {
    const prompt = buildGeneratePrompt('healthy chicken pasta')
    expect(prompt).toContain('healthy chicken pasta')
  })

  it('requests structured recipe format', () => {
    const prompt = buildGeneratePrompt('any dish')
    expect(prompt.toLowerCase()).toContain('ingredients')
    expect(prompt.toLowerCase()).toContain('steps')
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/test/ai-prompts.test.ts
```

Expected: FAIL.

**Step 3: Create prompt builders**

Create `src/lib/ai/prompts.ts`:
```typescript
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
```

**Step 4: Run tests**

Run:
```bash
npm test -- src/test/ai-prompts.test.ts
```

Expected: All tests pass.

**Step 5: Create Gemini service**

Create `src/lib/ai/gemini.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { recipeSchema } from '@/lib/schemas'
import { buildParsePrompt, buildGeneratePrompt } from './prompts'
import type { z } from 'zod'

type ParsedRecipe = z.infer<typeof recipeSchema>

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
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
```

**Step 6: Commit**

```bash
git add src/lib/ai/ src/test/ai-prompts.test.ts
git commit -m "feat: add Gemini AI service with recipe parse and generate pipelines"
```

---

## Task 13: API Routes — /api/ai/parse and /api/ai/generate

**Files:**
- Create: `src/app/api/ai/parse/route.ts`
- Create: `src/app/api/ai/generate/route.ts`

**Step 1: Create parse API route**

Create `src/app/api/ai/parse/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { parseRecipe } from '@/lib/ai/gemini'
import { z } from 'zod'

const requestSchema = z.object({
  text: z.string().optional(),
  url: z.string().url().optional(),
}).refine((data) => data.text || data.url, {
  message: 'Either text or url must be provided',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, url } = requestSchema.parse(body)

    let rawText = text || ''

    if (url) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'RecipeAI/1.0' },
      })
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Could not fetch URL. Try pasting the recipe text directly.' },
          { status: 400 },
        )
      }
      rawText = await response.text()
      // Strip HTML tags for cleaner AI input
      rawText = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      // Limit to ~5000 chars to stay within token budget
      rawText = rawText.slice(0, 5000)
    }

    const recipe = await parseRecipe(rawText)
    return NextResponse.json(recipe)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid recipe data returned by AI', details: error.errors }, { status: 422 })
    }
    console.error('Parse error:', error)
    return NextResponse.json({ error: 'Failed to parse recipe' }, { status: 500 })
  }
}
```

**Step 2: Create generate API route**

Create `src/app/api/ai/generate/route.ts`:
```typescript
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
      return NextResponse.json({ error: 'Invalid recipe data returned by AI', details: error.errors }, { status: 422 })
    }
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}
```

**Step 3: Verify routes are accessible**

Run:
```bash
npm run dev
```

Test with curl (will fail without API key, but should return a 500 not a 404):
```bash
curl -X POST http://localhost:3000/api/ai/parse -H "Content-Type: application/json" -d '{"text":"test"}'
```

Expected: JSON error response (not 404), confirming route exists.

**Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add API routes for AI recipe parsing and generation"
```

---

## Task 14: Recipe Hooks (useRecipes)

**Files:**
- Create: `src/hooks/use-recipes.ts`

**Step 1: Create the useRecipes hook**

Create `src/hooks/use-recipes.ts`:
```tsx
'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Recipe } from '@/types/recipe'
import { v4 as uuid } from 'uuid'

export function useRecipes() {
  const recipes = useLiveQuery(() => db.recipes.orderBy('createdAt').reverse().toArray()) ?? []

  async function addRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
    const recipe: Recipe = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.recipes.add(recipe)
    return recipe
  }

  async function updateRecipe(id: string, data: Partial<Recipe>) {
    await db.recipes.update(id, { ...data, updatedAt: new Date() })
  }

  async function deleteRecipe(id: string) {
    await db.recipes.delete(id)
  }

  async function getRecipe(id: string) {
    return db.recipes.get(id)
  }

  return { recipes, addRecipe, updateRecipe, deleteRecipe, getRecipe }
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-recipes.ts
git commit -m "feat: add useRecipes hook with CRUD operations over IndexedDB"
```

---

## Task 15: Home Page — Recipe List

**Files:**
- Create: `src/components/recipe-card.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Step 1: Create RecipeCard component**

Create `src/components/recipe-card.tsx`:
```tsx
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const t = useTranslations('recipe')
  const locale = useLocale()
  const title = locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        {recipe.image && (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img src={recipe.image} alt={title} className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-2 text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.prepTime + recipe.cookTime}m
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {recipe.servings}
            </span>
          </div>
          {recipe.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Step 2: Update home page**

Replace `src/app/[locale]/page.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { RecipeCard } from '@/components/recipe-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const t = useTranslations()
  const { recipes } = useRecipes()
  const [search, setSearch] = useState('')

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.titleAr && r.titleAr.includes(search)) ||
    r.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('home.title')}</h1>
        <div className="flex gap-2">
          <Link href="/import">
            <Button size="sm">{t('common.import')}</Button>
          </Link>
          <Link href="/generate">
            <Button size="sm" variant="secondary">{t('common.generate')}</Button>
          </Link>
        </div>
      </div>

      <Input
        placeholder={t('home.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <p>{t('home.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Verify the home page renders**

Run `npm run dev`, visit http://localhost:3000/en. Should show empty state with "No recipes yet" message and Import/Generate buttons.

**Step 4: Commit**

```bash
git add src/components/recipe-card.tsx src/app/[locale]/page.tsx
git commit -m "feat: add home page with recipe grid, search, and empty state"
```

---

## Task 16: Recipe Detail Page + Serving Adjustment

**Files:**
- Create: `src/app/[locale]/recipes/[id]/page.tsx`

**Step 1: Create recipe detail page**

Create `src/app/[locale]/recipes/[id]/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { adjustQuantity, toFraction } from '@/lib/utils/servings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Users, Minus, Plus, ChefHat, Trash2 } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>()
  const t = useTranslations('recipe')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { getRecipe, deleteRecipe } = useRecipes()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [servings, setServings] = useState(4)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecipe(params.id).then((r) => {
      if (r) {
        setRecipe(r)
        setServings(r.servings)
      }
      setLoading(false)
    })
  }, [params.id])

  if (loading) return <div className="py-20 text-center text-muted-foreground">{tc('loading')}</div>
  if (!recipe) return <div className="py-20 text-center text-muted-foreground">Recipe not found</div>

  const title = locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title
  const description = locale === 'ar' && recipe.descriptionAr ? recipe.descriptionAr : recipe.description

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {recipe.image && (
        <div className="aspect-video overflow-hidden rounded-lg">
          <img src={recipe.image} alt={title} className="h-full w-full object-cover" />
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t('prepTime')}: {recipe.prepTime}m</span>
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t('cookTime')}: {recipe.cookTime}m</span>
      </div>

      {/* Serving Adjuster */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <span className="font-medium">{t('servings')}</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setServings(Math.max(1, servings - 1))}
              disabled={servings <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-lg font-bold">{servings}</span>
            <Button variant="outline" size="icon" onClick={() => setServings(servings + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader><CardTitle>{t('ingredients')}</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => {
              const qty = adjustQuantity(ing.quantity, recipe.servings, servings)
              const name = locale === 'ar' && ing.nameAr ? ing.nameAr : ing.name
              return (
                <li key={i} className="flex justify-between">
                  <span>{name}</span>
                  <span className="text-muted-foreground">{toFraction(qty)} {ing.unit}</span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader><CardTitle>{t('steps')}</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {recipe.steps.map((step) => {
              const instruction = locale === 'ar' && step.instructionAr ? step.instructionAr : step.instruction
              return (
                <li key={step.order} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.order}
                  </span>
                  <div>
                    <p>{instruction}</p>
                    {step.duration && (
                      <p className="mt-1 text-sm text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />{step.duration}m</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Nutrition */}
      {recipe.nutrition && (
        <Card>
          <CardHeader><CardTitle>{t('nutrition')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{recipe.nutrition.calories}</p>
                <p className="text-sm text-muted-foreground">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{recipe.nutrition.protein}g</p>
                <p className="text-sm text-muted-foreground">protein</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{recipe.nutrition.carbs}g</p>
                <p className="text-sm text-muted-foreground">carbs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{recipe.nutrition.fat}g</p>
                <p className="text-sm text-muted-foreground">fat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/cook/${recipe.id}`} className="flex-1">
          <Button className="w-full" size="lg">
            <ChefHat className="mr-2 h-5 w-5" />
            {t('startCooking')}
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="lg"
          onClick={async () => {
            await deleteRecipe(recipe.id)
            window.history.back()
          }}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Verify rendering**

Run `npm run dev`. Navigate to `/en/recipes/nonexistent` — should show "Recipe not found". Once recipes are added via import/generate, this page will render them.

**Step 3: Commit**

```bash
git add src/app/[locale]/recipes/
git commit -m "feat: add recipe detail page with serving adjustment and bilingual display"
```

---

## Task 17: AI Import Page

**Files:**
- Create: `src/app/[locale]/import/page.tsx`

**Step 1: Create import page**

Create `src/app/[locale]/import/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ImportPage() {
  const t = useTranslations('import')
  const tc = useTranslations('common')
  const router = useRouter()
  const { addRecipe } = useRecipes()

  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleImport() {
    if (!text.trim() && !url.trim()) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim() || undefined,
          url: url.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to parse')
      }

      const recipeData = await response.json()
      const recipe = await addRecipe({
        ...recipeData,
        source: 'import' as const,
        sourceUrl: url.trim() || undefined,
      })
      router.push(`/recipes/${recipe.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('pasteUrl')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="https://example.com/recipe"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading || !!text.trim()}
          />
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">— or —</div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('pasteText')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste the full recipe text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            disabled={loading || !!url.trim()}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Button
        onClick={handleImport}
        disabled={loading || (!text.trim() && !url.trim())}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('importing')}</>
        ) : (
          t('title')
        )}
      </Button>
    </div>
  )
}
```

**Step 2: Verify**

Run `npm run dev`, visit `/en/import`. Should show text area and URL input.

**Step 3: Commit**

```bash
git add src/app/[locale]/import/
git commit -m "feat: add AI recipe import page with text and URL input"
```

---

## Task 18: AI Generate Page

**Files:**
- Create: `src/app/[locale]/generate/page.tsx`

**Step 1: Create generate page**

Create `src/app/[locale]/generate/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'

export default function GeneratePage() {
  const t = useTranslations('generate')
  const router = useRouter()
  const { addRecipe } = useRecipes()

  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!description.trim()) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate')
      }

      const recipeData = await response.json()
      const recipe = await addRecipe({
        ...recipeData,
        source: 'generated' as const,
      })
      router.push(`/recipes/${recipe.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder={t('placeholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={loading || !description.trim()}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('generating')}</>
        ) : (
          <><Sparkles className="mr-2 h-4 w-4" />{t('title')}</>
        )}
      </Button>
    </div>
  )
}
```

**Step 2: Verify**

Run `npm run dev`, visit `/en/generate`. Should show description input and generate button.

**Step 3: Commit**

```bash
git add src/app/[locale]/generate/
git commit -m "feat: add AI recipe generation page"
```

---

## Task 19: Cooking Mode

**Files:**
- Create: `src/app/[locale]/cook/[id]/page.tsx`

**Step 1: Create cooking mode page**

Create `src/app/[locale]/cook/[id]/page.tsx`:
```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Timer } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

export default function CookModePage() {
  const params = useParams<{ id: string }>()
  const t = useTranslations('cook')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { getRecipe } = useRecipes()
  const isRtl = locale === 'ar'

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    getRecipe(params.id).then((r) => r && setRecipe(r))
  }, [params.id])

  // Timer logic
  useEffect(() => {
    if (!timerRunning || timerSeconds === null || timerSeconds <= 0) return
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerRunning, timerSeconds])

  const goNext = useCallback(() => {
    if (!recipe) return
    if (currentStep < recipe.steps.length - 1) {
      setCurrentStep((s) => s + 1)
      setTimerSeconds(null)
      setTimerRunning(false)
    }
  }, [recipe, currentStep])

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
      setTimerSeconds(null)
      setTimerRunning(false)
    }
  }, [currentStep])

  // Swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null)
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX)
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const diff = e.changedTouches[0].clientX - touchStart
    const threshold = 50
    if (isRtl) {
      if (diff < -threshold) goPrev()
      if (diff > threshold) goNext()
    } else {
      if (diff < -threshold) goNext()
      if (diff > threshold) goPrev()
    }
    setTouchStart(null)
  }

  if (!recipe) return <div className="flex h-screen items-center justify-center">{tc('loading')}</div>

  const step = recipe.steps[currentStep]
  const instruction = locale === 'ar' && step.instructionAr ? step.instructionAr : step.instruction
  const isDone = currentStep === recipe.steps.length - 1
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {t('step', { current: currentStep + 1, total: recipe.steps.length })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((currentStep + 1) / recipe.steps.length) * 100}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
          {currentStep + 1}
        </div>
        <p className="max-w-lg text-2xl font-medium leading-relaxed">{instruction}</p>

        {/* Timer */}
        {step.duration && (
          <div className="mt-8">
            {timerSeconds === null ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setTimerSeconds(step.duration! * 60)
                  setTimerRunning(true)
                }}
              >
                <Timer className="mr-2 h-5 w-5" />
                {t('timer', { minutes: step.duration })}
              </Button>
            ) : (
              <div className="text-center">
                <p className={`text-4xl font-mono font-bold ${timerSeconds === 0 ? 'text-primary animate-pulse' : ''}`}>
                  {formatTime(timerSeconds)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setTimerRunning(!timerRunning)
                  }}
                >
                  {timerRunning ? 'Pause' : timerSeconds === 0 ? 'Done' : 'Resume'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t px-4 py-4">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4 rtl:rotate-180" />
          {t('previous')}
        </Button>

        {isDone ? (
          <Button size="lg" onClick={() => window.history.back()}>
            {t('done')}
          </Button>
        ) : (
          <Button onClick={goNext}>
            {t('next')}
            <ChevronRight className="ml-1 h-4 w-4 rtl:rotate-180" />
          </Button>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify**

Run `npm run dev`. The cooking mode route exists at `/en/cook/[id]`.

**Step 3: Commit**

```bash
git add src/app/[locale]/cook/
git commit -m "feat: add full-screen cooking mode with step navigation, timers, and swipe support"
```

---

## Task 20: Meal Planning Page

**Files:**
- Create: `src/hooks/use-meal-plan.ts`
- Create: `src/app/[locale]/plan/page.tsx`

**Step 1: Create useMealPlan hook**

Create `src/hooks/use-meal-plan.ts`:
```tsx
'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { MealPlan, PlannedMeal, DayOfWeek, MealSlot } from '@/types/meal-plan'
import { v4 as uuid } from 'uuid'

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function useMealPlan() {
  const weekStart = getWeekStart()

  const mealPlan = useLiveQuery(async () => {
    const existing = await db.mealPlans
      .where('weekStart')
      .equals(weekStart)
      .first()
    return existing ?? null
  }, [weekStart.toISOString()])

  async function getOrCreatePlan(): Promise<MealPlan> {
    const existing = await db.mealPlans.where('weekStart').equals(weekStart).first()
    if (existing) return existing

    const plan: MealPlan = {
      id: uuid(),
      weekStart,
      meals: [],
    }
    await db.mealPlans.add(plan)
    return plan
  }

  async function addMeal(day: DayOfWeek, slot: MealSlot, recipeId: string, servings: number) {
    const plan = await getOrCreatePlan()
    const meal: PlannedMeal = { day, slot, recipeId, servings }
    const meals = [...plan.meals.filter((m) => !(m.day === day && m.slot === slot)), meal]
    await db.mealPlans.update(plan.id, { meals })
  }

  async function removeMeal(day: DayOfWeek, slot: MealSlot) {
    if (!mealPlan) return
    const meals = mealPlan.meals.filter((m) => !(m.day === day && m.slot === slot))
    await db.mealPlans.update(mealPlan.id, { meals })
  }

  return { mealPlan, addMeal, removeMeal, weekStart }
}
```

**Step 2: Create meal plan page**

Create `src/app/[locale]/plan/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useMealPlan } from '@/hooks/use-meal-plan'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, X, ShoppingCart } from 'lucide-react'
import type { DayOfWeek, MealSlot } from '@/types/meal-plan'

const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

export default function MealPlanPage() {
  const t = useTranslations('plan')
  const { mealPlan, addMeal, removeMeal } = useMealPlan()
  const { recipes } = useRecipes()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ day: DayOfWeek; slot: MealSlot } | null>(null)

  function getMeal(day: DayOfWeek, slot: MealSlot) {
    return mealPlan?.meals.find((m) => m.day === day && m.slot === slot)
  }

  function getRecipeTitle(recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId)
    return recipe?.title ?? 'Unknown'
  }

  async function handleSelectRecipe(recipeId: string) {
    if (!selectedSlot) return
    await addMeal(selectedSlot.day, selectedSlot.slot, recipeId, 2)
    setDialogOpen(false)
    setSelectedSlot(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link href="/grocery">
          <Button variant="secondary">
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t('generateGroceryList')}
          </Button>
        </Link>
      </div>

      {/* Desktop grid */}
      <div className="hidden overflow-x-auto md:block">
        <div className="grid min-w-[800px] grid-cols-8 gap-2">
          {/* Header */}
          <div />
          {DAYS.map((day) => (
            <div key={day} className="text-center text-sm font-semibold">{DAY_LABELS[day]}</div>
          ))}

          {/* Rows */}
          {SLOTS.map((slot) => (
            <>
              <div key={`label-${slot}`} className="flex items-center text-sm font-medium capitalize">{t(slot)}</div>
              {DAYS.map((day) => {
                const meal = getMeal(day, slot)
                return (
                  <Card key={`${day}-${slot}`} className="min-h-[80px]">
                    <CardContent className="flex h-full items-center justify-center p-2">
                      {meal ? (
                        <div className="flex w-full items-center justify-between">
                          <span className="line-clamp-2 text-xs">{getRecipeTitle(meal.recipeId)}</span>
                          <button
                            onClick={() => removeMeal(day, slot)}
                            className="ml-1 shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedSlot({ day, slot })
                            setDialogOpen(true)
                          }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* Mobile: day-by-day */}
      <div className="space-y-4 md:hidden">
        {DAYS.map((day) => (
          <Card key={day}>
            <CardContent className="p-4">
              <h3 className="mb-2 font-semibold">{DAY_LABELS[day]}</h3>
              {SLOTS.map((slot) => {
                const meal = getMeal(day, slot)
                return (
                  <div key={slot} className="flex items-center justify-between border-b py-2 last:border-0">
                    <span className="text-sm capitalize text-muted-foreground">{t(slot)}</span>
                    {meal ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getRecipeTitle(meal.recipeId)}</span>
                        <button onClick={() => removeMeal(day, slot)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSlot({ day, slot })
                          setDialogOpen(true)
                        }}
                        className="text-sm text-primary"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recipe picker dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Recipe</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {recipes.length === 0 ? (
              <p className="text-center text-muted-foreground">No recipes yet. Import or generate some first!</p>
            ) : (
              recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleSelectRecipe(recipe.id)}
                  className="w-full rounded-md border p-3 text-start hover:bg-accent transition-colors"
                >
                  <p className="font-medium">{recipe.title}</p>
                  <p className="text-sm text-muted-foreground">{recipe.prepTime + recipe.cookTime}m · {recipe.servings} servings</p>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Step 3: Verify**

Run `npm run dev`, visit `/en/plan`. Should show weekly grid (desktop) or day cards (mobile).

**Step 4: Commit**

```bash
git add src/hooks/use-meal-plan.ts src/app/[locale]/plan/
git commit -m "feat: add meal planning page with weekly grid and recipe picker"
```

---

## Task 21: Grocery List Page

**Files:**
- Create: `src/hooks/use-grocery-list.ts`
- Create: `src/app/[locale]/grocery/page.tsx`

**Step 1: Create useGroceryList hook**

Create `src/hooks/use-grocery-list.ts`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { useMealPlan } from './use-meal-plan'
import { useRecipes } from './use-recipes'
import { aggregateGroceryItems } from '@/lib/utils/grocery'
import type { GroceryItem } from '@/types/grocery'

export function useGroceryList() {
  const { mealPlan } = useMealPlan()
  const { recipes } = useRecipes()
  const [items, setItems] = useState<GroceryItem[]>([])

  useEffect(() => {
    if (!mealPlan || mealPlan.meals.length === 0) {
      setItems([])
      return
    }

    const mealIngredients = mealPlan.meals
      .map((meal) => {
        const recipe = recipes.find((r) => r.id === meal.recipeId)
        if (!recipe) return null
        return {
          ingredients: recipe.ingredients,
          servingsMultiplier: meal.servings / recipe.servings,
        }
      })
      .filter(Boolean) as { ingredients: typeof recipes[0]['ingredients']; servingsMultiplier: number }[]

    setItems(aggregateGroceryItems(mealIngredients))
  }, [mealPlan, recipes])

  function toggleItem(index: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
    )
  }

  return { items, toggleItem }
}
```

**Step 2: Create grocery list page**

Create `src/app/[locale]/grocery/page.tsx`:
```tsx
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useGroceryList } from '@/hooks/use-grocery-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { toFraction } from '@/lib/utils/servings'

export default function GroceryPage() {
  const t = useTranslations('grocery')
  const locale = useLocale()
  const { items, toggleItem } = useGroceryList()

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="py-20 text-center text-muted-foreground">{t('empty')}</p>
      </div>
    )
  }

  // Group by category
  const grouped = items.reduce<Record<string, typeof items>>((acc, item, index) => {
    const cat = item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ ...item, _index: index } as typeof item & { _index: number })
    return acc
  }, {})

  const allChecked = items.every((i) => i.checked)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {allChecked && (
        <div className="rounded-md bg-primary/10 p-3 text-center text-sm font-medium text-primary">
          {t('allChecked')}
        </div>
      )}

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base capitalize">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {categoryItems.map((item) => {
                const idx = (item as typeof item & { _index: number })._index
                const name = locale === 'ar' && item.nameAr ? item.nameAr : item.name
                return (
                  <li key={idx}>
                    <button
                      onClick={() => toggleItem(idx)}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-start transition-colors hover:bg-accent ${
                        item.checked ? 'text-muted-foreground line-through' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            item.checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                          }`}
                        >
                          {item.checked && <Check className="h-3 w-3" />}
                        </span>
                        {name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {toFraction(item.quantity)} {item.unit}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

**Step 3: Verify**

Run `npm run dev`, visit `/en/grocery`. Shows empty state initially, then categorized items after meals are planned.

**Step 4: Commit**

```bash
git add src/hooks/use-grocery-list.ts src/app/[locale]/grocery/
git commit -m "feat: add grocery list page with categorized items and check-off"
```

---

## Task 22: Settings Page (Language, Theme, Data Export/Import)

**Files:**
- Create: `src/app/[locale]/settings/page.tsx`

**Step 1: Create settings page**

Create `src/app/[locale]/settings/page.tsx`:
```tsx
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { useTheme } from 'next-themes'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function switchLocale(newLocale: 'en' | 'ar') {
    router.replace(pathname, { locale: newLocale })
  }

  async function handleExport() {
    const data = {
      recipes: await db.recipes.toArray(),
      mealPlans: await db.mealPlans.toArray(),
      groceryLists: await db.groceryLists.toArray(),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recipe-ai-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.recipes) await db.recipes.bulkPut(data.recipes)
      if (data.mealPlans) await db.mealPlans.bulkPut(data.mealPlans)
      if (data.groceryLists) await db.groceryLists.bulkPut(data.groceryLists)
      alert('Data imported successfully!')
    } catch {
      alert('Invalid backup file.')
    }
    event.target.value = ''
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('language')}</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={locale === 'en' ? 'default' : 'outline'}
            onClick={() => switchLocale('en')}
          >
            English
          </Button>
          <Button
            variant={locale === 'ar' ? 'default' : 'outline'}
            onClick={() => switchLocale('ar')}
          >
            العربية
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('theme')}</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t_) => (
            <Button
              key={t_}
              variant={theme === t_ ? 'default' : 'outline'}
              onClick={() => setTheme(t_)}
            >
              {t(t_)}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('export')} / {t('importData')}</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('export')}
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {t('importData')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Verify**

Run `npm run dev`, visit `/en/settings`. Should show language, theme, and export/import controls.

**Step 3: Commit**

```bash
git add src/app/[locale]/settings/
git commit -m "feat: add settings page with language, theme, and data export/import"
```

---

## Task 23: Run All Tests & Fix Issues

**Files:**
- All test files

**Step 1: Run the full test suite**

Run:
```bash
npm test
```

Expected: All tests pass (schemas, db, servings, grocery, ai-prompts, smoke test).

**Step 2: Fix any failures**

If any tests fail, fix the specific issue. Common issues:
- Import path mismatches — verify `@/` alias resolves correctly in vitest.config.ts
- Missing `fake-indexeddb/auto` in setup — verify setup.ts is loaded

**Step 3: Run the build to check for TypeScript errors**

Run:
```bash
npm run build
```

Expected: Build succeeds with no type errors.

**Step 4: Fix any build errors**

Address any TypeScript compilation errors. Common issues:
- Missing `'use client'` directives on components using hooks
- Type mismatches between Dexie entities and TypeScript interfaces

**Step 5: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve test and build issues"
```

---

## Task 24: Delete Smoke Test & Final Cleanup

**Files:**
- Delete: `src/test/example.test.ts`

**Step 1: Remove the smoke test**

Delete `src/test/example.test.ts` — it was only for verifying the test setup.

**Step 2: Run tests one final time**

Run:
```bash
npm test
```

Expected: All remaining tests pass.

**Step 3: Run dev server and manually verify all pages**

Run `npm run dev` and visit:
- `/en` — Home page with empty state
- `/en/import` — Import page with text/URL inputs
- `/en/generate` — Generate page with description input
- `/en/plan` — Meal plan grid
- `/en/grocery` — Grocery list (empty state)
- `/en/settings` — Settings with language/theme/export
- `/ar` — Arabic home page, RTL layout
- `/ar/settings` — Arabic settings page

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: remove smoke test, finalize MVP"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project scaffolding | Next.js, Tailwind, env files |
| 2 | Install dependencies | dexie, next-intl, zod, gemini, vitest |
| 3 | Setup Vitest | vitest.config.ts, test setup |
| 4 | Initialize shadcn/ui | components.json, base components |
| 5 | Custom theme | globals.css color variables |
| 6 | Types & schemas | types/, schemas.ts + tests |
| 7 | Database layer | db.ts + tests |
| 8 | i18n setup | next-intl, AR/EN messages, middleware |
| 9 | App shell | Header, BottomNav, ThemeProvider |
| 10 | Serving utilities | servings.ts + tests |
| 11 | Grocery utilities | grocery.ts + tests |
| 12 | AI service | gemini.ts, prompts.ts + tests |
| 13 | API routes | /api/ai/parse, /api/ai/generate |
| 14 | Recipe hooks | use-recipes.ts |
| 15 | Home page | Recipe grid, search, empty state |
| 16 | Recipe detail | Serving adjuster, bilingual display |
| 17 | Import page | Text/URL input, AI parsing |
| 18 | Generate page | Description input, AI generation |
| 19 | Cooking mode | Full-screen steps, timer, swipe |
| 20 | Meal planning | Weekly grid, recipe picker |
| 21 | Grocery list | Categorized, checkable, aggregated |
| 22 | Settings | Language, theme, data export/import |
| 23 | Test & build | Full test suite, build verification |
| 24 | Cleanup | Remove smoke test, final checks |
