# Recipe App Clone — Design Document

**Date**: 2026-02-23
**Status**: Approved
**Target**: Web-based clone of Suha (AI Recipe Organizer)

---

## Overview

A free, bilingual (Arabic + English) web app that uses AI to import, generate, and organize recipes. Differentiator: integrated meal planning and grocery list generation.

## Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | Best i18n/RTL ecosystem, file-based routing |
| UI Components | shadcn/ui + Lucide icons | Free, accessible, composable |
| AI | Google Gemini 1.5 Flash (free tier) | 15 RPM, 1M tokens/day, structured JSON output |
| Storage | IndexedDB via Dexie.js | Zero cost, offline-capable, generous limits |
| i18n | next-intl | Arabic + English, RTL support |
| Hosting | Vercel (free tier) | Zero cost, edge functions for API key protection |
| Typography | Inter (Latin) + Cairo (Arabic) | Clean, modern, excellent readability |

**Total cost: $0**

## Features (MVP)

1. **AI Recipe Import** — Paste text or URL, AI extracts structured recipe
2. **AI Recipe Generation** — Describe a dish, AI creates full recipe (bilingual)
3. **Serving-Size Adjustment** — Change servings, ingredients recalculate (math-based, no AI)
4. **Step-by-Step Cooking Mode** — Full-screen, large text, step navigation, timers
5. **Meal Planning** — Weekly calendar grid, drag recipes to day/slot
6. **Grocery List** — Auto-generated from meal plan, categorized, checkable

## Architecture

```
Next.js App
├── Pages (App Router)
│   ├── /                    # Home — recipe grid
│   ├── /recipes/[id]        # Recipe detail + serving adjuster
│   ├── /recipes/new         # Manual recipe entry
│   ├── /cook/[id]           # Cooking mode (full-screen)
│   ├── /import              # AI import (text/URL)
│   ├── /generate            # AI generation
│   ├── /plan                # Meal planner (weekly)
│   ├── /grocery             # Grocery checklist
│   └── /settings            # Language, theme, data export
├── API Routes
│   ├── /api/ai/parse        # Recipe import pipeline
│   └── /api/ai/generate     # Recipe generation pipeline
├── Components
│   ├── RecipeCard, CookMode, MealPlanGrid, GroceryList, ImportForm
│   └── ... (shadcn/ui base)
├── Hooks/Context
│   ├── useRecipes(), useMealPlan(), useGroceryList()
│   └── useGemini(), useI18n()
└── Storage
    └── IndexedDB (Dexie.js) — recipes, mealPlans, groceryLists, preferences
```

API routes proxy Gemini calls so the API key stays server-side.

## Data Models

### Recipe (central entity)

```typescript
interface Recipe {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  image?: string;
  servings: number;
  prepTime: number;        // minutes
  cookTime: number;        // minutes
  cuisine?: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
  nutrition?: NutritionInfo;
  source: 'import' | 'generated' | 'manual';
  sourceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Ingredient {
  name: string;
  nameAr?: string;
  quantity: number;        // base quantity for recipe's servings
  unit: string;
  category: string;        // produce, dairy, protein, spice, etc.
}

interface Step {
  order: number;
  instruction: string;
  instructionAr?: string;
  duration?: number;       // minutes (for timers)
}
```

### Meal Planning

```typescript
interface MealPlan {
  id: string;
  weekStart: Date;
  meals: PlannedMeal[];
}

interface PlannedMeal {
  day: 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';
  slot: 'breakfast'|'lunch'|'dinner'|'snack';
  recipeId: string;
  servings: number;
}

interface GroceryList {
  id: string;
  mealPlanId: string;
  items: GroceryItem[];
  createdAt: Date;
}

interface GroceryItem {
  name: string;
  nameAr?: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
}
```

## AI Integration

### Two Pipelines

**Import (`/api/ai/parse`)**:
1. Receive raw text or URL
2. If URL: server-side fetch, extract text content
3. Send to Gemini with structured prompt + JSON schema
4. Validate response with Zod
5. Normalize units, categorize ingredients
6. Return structured Recipe object

**Generate (`/api/ai/generate`)**:
1. Receive natural language description
2. Send to Gemini requesting bilingual output
3. Validate + normalize
4. Return full Recipe with AR + EN content

### Gemini Config
- Model: `gemini-1.5-flash`
- Response format: JSON mode with schema enforcement
- Temperature: 0.3 (parsing), 0.7 (generation)
- Free tier limits: 15 RPM, 1M tokens/day

## UI Design

### Visual Direction
- Warm, food-friendly palette: earthy greens, amber accents, clean whites
- Dark mode support (system preference + toggle)
- shadcn/ui base components customized with recipe-app theme

### Responsive Breakpoints
- Mobile (<640px): Single column, bottom navigation
- Tablet (640-1024px): Two columns, side navigation
- Desktop (>1024px): Three columns, full sidebar

### Key UI Patterns
- **Recipe Cards**: Grid with image, title, prep time, tags
- **Cooking Mode**: Full-screen, large text (24px+), swipe navigation, step timers
- **Meal Planner**: 7-column weekly grid, drag-and-drop
- **Grocery List**: Categorized sections, tap-to-check

### RTL Strategy
- `dir="rtl"` on `<html>` when Arabic selected
- Tailwind `rtl:` variants for RTL-specific styles
- CSS logical properties (`margin-inline-start`)
- Both language strings stored simultaneously

## Error Handling

- **Rate limit**: Friendly message + exponential backoff retry
- **Malformed AI response**: Zod catches → retry once → fallback to manual entry
- **URL scraping fails**: Suggest copy-paste text instead
- **Offline**: Browsing/cooking/planning work offline; AI features show offline indicator

## Data Safety

- Export/Import all data as JSON from settings
- No data loss on language switch (both languages stored)
- Serving adjustment: fraction display (½, ¼, ⅓), minimum 1 serving, non-scalable ingredients flagged
