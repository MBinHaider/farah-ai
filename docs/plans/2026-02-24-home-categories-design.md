# Home Page Categories Design

## Problem

The home page is a flat grid of all recipes with no organization. New users see an empty state. There's no visual distinction between video-imported recipes and others, and no curated content to get users started.

## Solution

Reorganize the home page into sections and pre-load starter recipes in two categories (Soups, Salads) with high-quality food photos.

## Home Page Layout (top to bottom)

1. **Header** — "My Recipes" + Import / Generate buttons (existing, unchanged)
2. **From Videos** — Recipes where `source === 'import'` and `sourceUrl` contains a video URL. Only renders when there are matching recipes. Film icon in section header.
3. **Soups** — Pre-loaded soup recipes + any user recipes tagged "soup". Section header with soup icon.
4. **Salads** — Pre-loaded salad recipes + any user recipes tagged "salad". Section header with salad icon.
5. **All Recipes** — Search bar + full grid of everything. Existing behavior, now at the bottom.

Each section uses the existing responsive grid (1→2→3→4 columns).

## Pre-loaded Starter Recipes

### Storage
- Seed file: `src/data/starter-recipes.ts` — array of complete `Recipe` objects
- Seeded into IndexedDB on first app open
- Seeding guard: check `preferences` table for `{ id: 'app', seeded: true }`
- `source: 'manual'` to distinguish from user imports/generations

### Recipe Data
- 3 soup recipes + 3 salad recipes (6 total)
- Bilingual: English + Arabic titles, descriptions, steps
- Full ingredients, steps (with structured sub-actions), nutrition
- Images: Unsplash photo URLs (free, high quality)
- Tags include `"soup"` or `"salad"` for section filtering

### Soups (3 recipes)
1. Lentil Soup (شوربة عدس) — Middle Eastern staple
2. Tomato Basil Soup — Classic Western
3. Chicken Noodle Soup (شوربة دجاج) — Universal comfort food

### Salads (3 recipes)
1. Fattoush (فتوش) — Middle Eastern bread salad
2. Caesar Salad — Classic Western
3. Tabbouleh (تبولة) — Middle Eastern parsley salad

### Images
Unsplash direct URLs for each recipe. Example format:
`https://images.unsplash.com/photo-XXXXX?w=800&h=600&fit=crop`

## Section Filtering Logic

```typescript
const videoRecipes = recipes.filter(r =>
  r.source === 'import' && r.sourceUrl && isVideoUrl(r.sourceUrl)
)
const soupRecipes = recipes.filter(r =>
  r.tags.some(t => t.toLowerCase() === 'soup')
)
const saladRecipes = recipes.filter(r =>
  r.tags.some(t => t.toLowerCase() === 'salad')
)
```

## i18n Keys

```json
{
  "home": {
    "fromVideos": "From Videos",
    "soups": "Soups",
    "salads": "Salads",
    "allRecipes": "All Recipes"
  }
}
```

Arabic:
```json
{
  "home": {
    "fromVideos": "من الفيديوهات",
    "soups": "الشوربات",
    "salads": "السلطات",
    "allRecipes": "جميع الوصفات"
  }
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/data/starter-recipes.ts` | NEW — seed data for 6 recipes |
| `src/hooks/use-recipes.ts` | Add seeding logic on first load |
| `src/app/[locale]/page.tsx` | Reorganize into sections |
| `src/messages/en.json` | Add section header keys |
| `src/messages/ar.json` | Add section header keys (Arabic) |

## What Stays Unchanged

- `src/components/recipe-card.tsx` — reused as-is
- `src/lib/db.ts` — no schema changes
- `src/types/recipe.ts` — no type changes
- Recipe detail, cook, import, generate pages — unchanged
