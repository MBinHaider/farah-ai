# Visual Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Farah AI from a laptop-oriented web app into a native-feeling mobile cooking app with PWA capabilities.

**Architecture:** Layered redesign — update CSS tokens first, then app shell (nav/header/layout), then shared components, then each page individually. Framer Motion for all animations. Serwist for PWA. Mobile-first throughout.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4, shadcn/ui (restyled), Framer Motion 12, Serwist (PWA), Dexie (IndexedDB), next-intl

---

## Phase 1: Foundation — Dependencies & Design Tokens

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install framer-motion and serwist**

Run: `npm install framer-motion @serwist/next`
Run: `npm install -D serwist`

**Step 2: Verify install succeeded**

Run: `npm run build`
Expected: Build passes with no errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add framer-motion and serwist dependencies"
```

---

### Task 2: Update design system color tokens

**Files:**
- Modify: `src/app/globals.css:50-119`

**Step 1: Update light mode tokens**

Replace the `:root` block (lines 50-84) with warm cream base + lavender accent:

```css
:root {
  --background: hsl(30 30% 98%);
  --foreground: hsl(270 10% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(270 10% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(270 10% 15%);
  --primary: hsl(270 60% 65%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(270 40% 92%);
  --secondary-foreground: hsl(270 10% 20%);
  --muted: hsl(30 20% 96%);
  --muted-foreground: hsl(270 5% 45%);
  --accent: hsl(25 80% 55%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 72% 51%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(30 15% 90%);
  --input: hsl(30 15% 90%);
  --ring: hsl(270 60% 65%);
  --radius: 0.75rem;
  /* Sidebar tokens kept for shadcn compatibility */
  --sidebar: hsl(30 20% 96%);
  --sidebar-foreground: hsl(270 10% 15%);
  --sidebar-primary: hsl(270 60% 65%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(270 40% 92%);
  --sidebar-accent-foreground: hsl(270 10% 20%);
  --sidebar-border: hsl(30 15% 90%);
  --sidebar-ring: hsl(270 60% 65%);
  --chart-1: hsl(270 60% 65%);
  --chart-2: hsl(25 80% 55%);
  --chart-3: hsl(0 72% 51%);
  --chart-4: hsl(30 20% 96%);
  --chart-5: hsl(270 5% 45%);
}
```

**Step 2: Update dark mode tokens**

Replace the `.dark` block (lines 86-119) with rich dark + bright lavender:

```css
.dark {
  --background: hsl(270 15% 8%);
  --foreground: hsl(30 10% 95%);
  --card: hsl(270 12% 12%);
  --card-foreground: hsl(30 10% 95%);
  --popover: hsl(270 12% 12%);
  --popover-foreground: hsl(30 10% 95%);
  --primary: hsl(270 70% 72%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(270 20% 20%);
  --secondary-foreground: hsl(30 10% 95%);
  --muted: hsl(270 12% 16%);
  --muted-foreground: hsl(270 10% 55%);
  --accent: hsl(25 85% 60%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 72% 51%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(270 10% 20%);
  --input: hsl(270 10% 26%);
  --ring: hsl(270 70% 72%);
  --sidebar: hsl(270 12% 12%);
  --sidebar-foreground: hsl(30 10% 95%);
  --sidebar-primary: hsl(270 70% 72%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(270 20% 20%);
  --sidebar-accent-foreground: hsl(30 10% 95%);
  --sidebar-border: hsl(270 10% 20%);
  --sidebar-ring: hsl(270 70% 72%);
  --chart-1: hsl(270 70% 72%);
  --chart-2: hsl(25 85% 60%);
  --chart-3: hsl(0 72% 51%);
  --chart-4: hsl(270 12% 16%);
  --chart-5: hsl(270 10% 55%);
}
```

**Step 3: Update radius in @theme block**

In the `@theme inline` block (line 41-47), the radius values derive from `--radius`. The new `--radius: 0.75rem` will propagate automatically. No change needed.

**Step 4: Verify colors render correctly**

Run: `npm run build`
Expected: Build passes. Verify in browser that warm cream background and lavender accents appear.

**Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: update color tokens to warm cream + lavender palette"
```

---

### Task 3: Update typography and global spacing

**Files:**
- Modify: `src/app/[locale]/layout.tsx:56`
- Modify: `src/app/globals.css` (add utility classes at bottom)

**Step 1: Change main content padding to 16px mobile gutters**

In `layout.tsx` line 56, change:
```
<main className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 md:pb-6">
```
to:
```
<main className="mx-auto max-w-lg px-4 pb-24 pt-4 md:max-w-6xl md:px-6 md:pb-6">
```

This constrains mobile to a narrower max-width (32rem/512px) and reduces top padding from 24px to 16px. Desktop stays wide.

**Step 2: Add shimmer animation to globals.css**

Add at the bottom of `src/app/globals.css`:

```css
/* Shimmer loading animation */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg, transparent 25%, hsl(var(--muted)) 50%, transparent 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Passes

**Step 4: Commit**

```bash
git add src/app/globals.css src/app/[locale]/layout.tsx
git commit -m "feat: update layout spacing and add shimmer animation"
```

---

## Phase 2: App Shell — Navigation & Layout

### Task 4: Redesign bottom navigation (4 tabs + frosted glass)

**Files:**
- Modify: `src/components/layout/bottom-nav.tsx` (full rewrite)

**Step 1: Rewrite bottom-nav.tsx**

Replace entire file with:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { Home, Sparkles, Calendar, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/' as const, icon: Home, labelKey: 'home' as const },
  { href: '/generate' as const, icon: Sparkles, labelKey: 'generate' as const },
  { href: '/plan' as const, icon: Calendar, labelKey: 'plan' as const },
  { href: '/settings' as const, icon: Settings, labelKey: 'settings' as const },
]

export function BottomNav() {
  const t = useTranslations('common')
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href} className="relative flex flex-col items-center gap-0.5 px-4 py-1.5">
              <motion.div
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="flex flex-col items-center gap-0.5"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`relative z-10 h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`relative z-10 text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {t(labelKey)}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

Key changes: 4 tabs (removed Grocery/Import), frosted glass bg, animated pill indicator, scale-on-tap.

**Step 2: Build and verify**

Run: `npm run build`
Expected: Passes. Bottom nav shows 4 tabs with pill animation.

**Step 3: Commit**

```bash
git add src/components/layout/bottom-nav.tsx
git commit -m "feat: redesign bottom nav with 4 tabs, frosted glass, animated pill"
```

---

### Task 5: Redesign header (minimal, contextual)

**Files:**
- Modify: `src/components/layout/header.tsx` (full rewrite)

**Step 1: Rewrite header.tsx**

Replace entire file. The new header shows "Farah AI" logo on home, and hides the desktop nav links (the bottom nav handles everything on mobile, desktop nav is simplified):

```tsx
'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'

export function Header() {
  const t = useTranslations('common')
  const pathname = usePathname()
  const isHome = pathname === '/'

  if (!isHome) return null

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4 md:max-w-6xl md:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <Image
            src="/logo.png"
            alt="Farah AI"
            width={28}
            height={42}
            className="h-7 w-auto"
            priority
          />
          {t('appName')}
        </Link>
      </div>
    </header>
  )
}
```

Note: The header only renders on the home page now. Other pages will have their own back buttons inline. This saves screen real estate on mobile.

**Step 2: Build and verify**

Run: `npm run build`
Expected: Passes. Header only shows on home.

**Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: simplify header to home-only minimal design"
```

---

## Phase 3: Shared Components

### Task 6: Create bottom sheet component

**Files:**
- Create: `src/components/ui/bottom-sheet.tsx`

**Step 1: Create the bottom sheet**

```tsx
'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  const dragControls = useDragControls()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card shadow-xl"
          >
            <div className="sticky top-0 flex justify-center bg-card pb-2 pt-3">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            {title && (
              <div className="px-4 pb-3">
                <h2 className="text-lg font-semibold">{title}</h2>
              </div>
            )}
            <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Passes (component not used yet, but compiles).

**Step 3: Commit**

```bash
git add src/components/ui/bottom-sheet.tsx
git commit -m "feat: add bottom sheet component with drag-to-dismiss"
```

---

### Task 7: Create FAB (Floating Action Button) component

**Files:**
- Create: `src/components/ui/fab.tsx`

**Step 1: Create the FAB**

```tsx
'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface FabProps {
  onClick: () => void
  label?: string
}

export function Fab({ onClick, label }: FabProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      aria-label={label || 'Add'}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 md:hidden"
    >
      <Plus className="h-6 w-6" />
    </motion.button>
  )
}
```

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/ui/fab.tsx
git commit -m "feat: add FAB component with spring animation"
```

---

### Task 8: Redesign recipe card for horizontal carousel

**Files:**
- Modify: `src/components/recipe-card.tsx` (full rewrite)

**Step 1: Rewrite recipe-card.tsx**

New design: portrait format, compact, optimized for horizontal scroll. Two variants — `compact` for carousels and `full` for grid.

```tsx
'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ChefHat, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Recipe } from '@/types/recipe'

interface RecipeCardProps {
  recipe: Recipe
  variant?: 'compact' | 'full'
}

export function RecipeCard({ recipe, variant = 'compact' }: RecipeCardProps) {
  const locale = useLocale()
  const title = locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title
  const totalTime = recipe.prepTime + recipe.cookTime

  return (
    <Link href={`/recipes/${recipe.id}` as never}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md ${
          variant === 'compact' ? 'w-40 shrink-0' : 'w-full'
        }`}
      >
        {recipe.image ? (
          <div className={`overflow-hidden ${variant === 'compact' ? 'aspect-[3/4]' : 'aspect-video'}`}>
            <img
              src={recipe.image}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className={`flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 ${
            variant === 'compact' ? 'aspect-[3/4]' : 'aspect-video'
          }`}>
            <ChefHat className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="p-3">
          <h3 className={`font-semibold leading-tight ${variant === 'compact' ? 'line-clamp-2 text-sm' : 'line-clamp-2 text-base'}`}>
            {title}
          </h3>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{totalTime}m</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
```

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/recipe-card.tsx
git commit -m "feat: redesign recipe card with compact/full variants and tap animation"
```

---

## Phase 4: Home Page Redesign

### Task 9: Rebuild home page with hero, quick actions, carousels

**Files:**
- Modify: `src/app/[locale]/page.tsx` (full rewrite)
- Modify: `src/messages/en.json` (add new i18n keys)
- Modify: `src/messages/ar.json` (add new i18n keys)

**Step 1: Add new i18n keys to en.json**

Add to `home` section:
```json
"askAi": "Ask AI",
"fromVideo": "From Video",
"importRecipe": "Import Recipe",
"pasteText": "Paste recipe text",
"pasteUrl": "Paste URL",
"yourRecipes": "Your Recipes"
```

Add matching Arabic keys to ar.json.

**Step 2: Rewrite the home page**

Replace entire `src/app/[locale]/page.tsx` with new layout: featured hero (full-width gradient overlay), quick action pills, horizontal scroll carousels, FAB + import bottom sheet.

Key structure:
1. Search icon in header area (expandable)
2. Featured hero with full-width image + gradient overlay + title + metadata at bottom
3. Quick Actions row: "Ask AI" pill → `/generate`, "From Video" pill (opens import sheet with URL field)
4. Horizontal carousel sections: "Your Recipes", "Soups", "Salads"
5. FAB (+) → opens import bottom sheet
6. Import bottom sheet: text area + URL input + submit button

The home page imports: `BottomSheet`, `Fab`, `RecipeCard`, framer-motion, and the existing hooks.

**Step 3: Build and verify**

Run: `npm run build`
Expected: Passes. Home page shows new layout.

**Step 4: Run tests**

Run: `npm test`
Expected: All existing tests still pass (home page has no unit tests).

**Step 5: Commit**

```bash
git add src/app/[locale]/page.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: redesign home page with hero, quick actions, carousels, and FAB"
```

---

## Phase 5: Recipe Detail Page Redesign

### Task 10: Rebuild recipe detail with full-bleed image and content sheet

**Files:**
- Modify: `src/app/[locale]/recipes/[id]/page.tsx` (full rewrite)

**Step 1: Rewrite recipe detail page**

New structure:
1. Full-bleed hero image (40vh) with floating back + delete buttons
2. Content sheet overlapping image (negative margin, rounded-t-3xl)
3. Title + metadata line (time, servings, calories, protein)
4. Description
5. Servings stepper (inline)
6. Tab switcher: Ingredients | Steps (using state, not separate routes)
7. Ingredients grouped by category with emoji prefix
8. Steps with numbered circles + sub-actions
9. Sticky "Start Cooking" CTA at bottom

Uses Framer Motion for:
- Content sheet animation on mount
- Tab switch crossfade
- Number counter for servings

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/[locale]/recipes/[id]/page.tsx
git commit -m "feat: redesign recipe detail with full-bleed image and content sheet"
```

---

## Phase 6: Cooking Mode Enhancement

### Task 11: Enhance cooking mode with Framer Motion gestures

**Files:**
- Modify: `src/app/[locale]/cook/[id]/page.tsx`

**Step 1: Replace touch handlers with Framer Motion drag gestures**

Replace the manual `touchStart`/`touchEnd` handlers with `motion.div` + `drag="x"` for step navigation. This gives spring physics and proper gesture recognition.

**Step 2: Add wake lock support**

Add a `useEffect` that acquires `navigator.wakeLock.request('screen')` on mount and releases on unmount. Wrap in try/catch for unsupported browsers.

**Step 3: Remove border-based top bar, use minimal layout**

Simplify the top bar: remove borders, use transparent background, larger close button area.

**Step 4: Increase step text size**

Change main instruction text from `text-2xl` to `text-xl md:text-2xl` and add `leading-relaxed` for readability while cooking.

**Step 5: Build and verify**

Run: `npm run build`

**Step 6: Commit**

```bash
git add src/app/[locale]/cook/[id]/page.tsx
git commit -m "feat: enhance cooking mode with Framer Motion gestures and wake lock"
```

---

## Phase 7: Generate Page Redesign

### Task 12: Redesign generate page with tappable chips and shimmer loading

**Files:**
- Modify: `src/app/[locale]/generate/page.tsx` (full rewrite)

**Step 1: Rewrite generate page**

New layout:
1. Friendly header: "What would you like to cook today?"
2. Text area for description
3. Tappable suggestion chips (pill buttons that auto-fill textarea on tap)
4. "Generate Recipe" button
5. Loading state: shimmer skeleton cards (not just spinner)

Remove the Card wrapper — use a simpler, more spacious layout.

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/[locale]/generate/page.tsx
git commit -m "feat: redesign generate page with tappable chips and shimmer loading"
```

---

## Phase 8: Import Page → Part of Home Bottom Sheet

### Task 13: Remove standalone import page route

**Files:**
- Delete: `src/app/[locale]/import/page.tsx` (import is now a bottom sheet on home)
- Modify: `src/messages/en.json` (no changes needed — keys already exist)

**Step 1: Verify import functionality works from home page bottom sheet**

The import bottom sheet (created in Task 9) already handles both text paste and URL input. The standalone import page is now redundant.

**Step 2: Keep the import route file but redirect to home**

Rather than deleting (to avoid broken links), convert to a redirect:

```tsx
import { redirect } from 'next/navigation'

export default function ImportPage() {
  redirect('/')
}
```

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/app/[locale]/import/page.tsx
git commit -m "feat: redirect import page to home (import is now bottom sheet)"
```

---

## Phase 9: Meal Plan Page Redesign

### Task 14: Redesign meal plan with vertical day layout

**Files:**
- Modify: `src/app/[locale]/plan/page.tsx` (full rewrite)
- Modify: `src/messages/en.json` (add `plan.viewGroceryList`)
- Modify: `src/messages/ar.json` (matching key)

**Step 1: Add i18n key**

In en.json `plan` section, add: `"viewGroceryList": "View Grocery List"`
In ar.json `plan` section, add: `"viewGroceryList": "عرض قائمة التسوق"`

**Step 2: Rewrite meal plan page**

New layout:
1. Week navigation header with left/right arrows (swipeable later)
2. Vertical day sections (Mon-Sun)
3. Each day: 4 meal slots (Breakfast/Lunch/Dinner/Snack) with emoji icons
4. "+ Add" opens recipe picker as bottom sheet (replace Dialog with BottomSheet)
5. Compact meal cards with recipe photo thumbnail
6. Sticky "View Grocery List" CTA at bottom

Remove the desktop table grid entirely — use the vertical layout for all screen sizes. On desktop, it can be a wider card layout.

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/app/[locale]/plan/page.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: redesign meal plan with vertical day layout and bottom sheet picker"
```

---

## Phase 10: Grocery List Redesign

### Task 15: Redesign grocery list with category emojis and share

**Files:**
- Modify: `src/app/[locale]/grocery/page.tsx` (full rewrite)
- Modify: `src/messages/en.json` (add new keys)
- Modify: `src/messages/ar.json` (matching keys)

**Step 1: Add i18n keys**

In en.json `grocery` section, add:
```json
"progress": "{checked} of {total} items",
"share": "Share List"
```

Add matching Arabic keys.

**Step 2: Create category emoji map**

```typescript
const CATEGORY_EMOJI: Record<string, string> = {
  produce: '🥕',
  protein: '🥩',
  dairy: '🧈',
  grain: '🍞',
  spice: '🧂',
  oil: '🫒',
  sweetener: '🍯',
  other: '📦',
}
```

**Step 3: Rewrite grocery page**

New layout:
1. Back button + title
2. Category sections with emoji prefix
3. Checkbox items with strikethrough on check
4. Progress bar at bottom: "N of M items"
5. Share button using Web Share API

Remove Card wrappers — use a simpler list layout.

**Step 4: Build and verify**

Run: `npm run build`

**Step 5: Commit**

```bash
git add src/app/[locale]/grocery/page.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: redesign grocery list with category emojis, progress, and share"
```

---

## Phase 11: Settings Page Redesign

### Task 16: Redesign settings with iOS-style grouped rows

**Files:**
- Modify: `src/app/[locale]/settings/page.tsx` (full rewrite)

**Step 1: Rewrite settings page**

New layout:
1. Back arrow + "Settings" title (inline)
2. Grouped sections with rounded containers:
   - **Appearance**: Language row (tap → toggles EN/AR), Theme row (tap → cycles Light/Dark/System)
   - **Data**: Export row (tap → downloads JSON), Import row (tap → file picker)
   - **About**: Version info + "Made with 💜"
3. Each row: icon + label + current value + chevron (›)

Use `motion.button` with `whileTap={{ scale: 0.98 }}` for tap feedback.

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/[locale]/settings/page.tsx
git commit -m "feat: redesign settings with iOS-style grouped rows"
```

---

## Phase 12: PWA Setup

### Task 17: Add PWA manifest and service worker

**Files:**
- Create: `public/manifest.json`
- Modify: `src/app/[locale]/layout.tsx` (add manifest link)
- Create: `src/app/sw.ts` (service worker source)
- Modify: `next.config.ts` (add serwist plugin)

**Step 1: Create manifest.json**

```json
{
  "name": "Farah AI",
  "short_name": "Farah",
  "description": "AI-powered recipe organizer — import, generate, and plan meals",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#9b7fd4",
  "background_color": "#faf8f5",
  "icons": [
    { "src": "/logo.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/logo.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Note: `#9b7fd4` is approximately `hsl(270, 60%, 65%)` and `#faf8f5` is approximately `hsl(30, 30%, 98%)`.

**Step 2: Add manifest link to layout.tsx**

In the `metadata` export, add:
```typescript
manifest: '/manifest.json',
```

**Step 3: Configure serwist in next.config.ts**

Read `next.config.ts` first, then wrap the config with `withSerwist`:

```typescript
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
})

// Wrap existing config
export default withSerwist(nextConfig)
```

**Step 4: Create service worker source**

```typescript
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

**Step 5: Build and verify**

Run: `npm run build`
Expected: Build generates sw.js in public/. Manifest is linked.

**Step 6: Commit**

```bash
git add public/manifest.json src/app/sw.ts src/app/[locale]/layout.tsx next.config.ts
git commit -m "feat: add PWA manifest and service worker with serwist"
```

---

### Task 18: Add install prompt and offline banner

**Files:**
- Create: `src/components/pwa/install-prompt.tsx`
- Create: `src/components/pwa/offline-banner.tsx`
- Modify: `src/app/[locale]/layout.tsx` (add components)
- Modify: `src/messages/en.json` (add pwa keys)
- Modify: `src/messages/ar.json` (add pwa keys)

**Step 1: Add i18n keys**

In en.json, add:
```json
"pwa": {
  "install": "Add to Home Screen",
  "installDescription": "Get the best experience with Farah AI",
  "dismiss": "Not now",
  "offline": "You're offline. Your recipes are still available."
}
```

Add matching Arabic keys.

**Step 2: Create install prompt component**

A banner that appears after the `beforeinstallprompt` event fires. Stores dismissal in localStorage.

**Step 3: Create offline banner component**

Listens to `online`/`offline` events. Shows a subtle top banner when offline.

**Step 4: Add both to layout.tsx**

Import and render after `<BottomNav />`.

**Step 5: Build and verify**

Run: `npm run build`

**Step 6: Commit**

```bash
git add src/components/pwa/ src/app/[locale]/layout.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: add PWA install prompt and offline banner"
```

---

## Phase 13: Final Polish

### Task 19: Add page transition animations

**Files:**
- Create: `src/components/page-transition.tsx`
- Modify: `src/app/[locale]/layout.tsx` (wrap children)

**Step 1: Create page transition wrapper**

A `motion.div` wrapper that applies crossfade on page changes using `AnimatePresence` with the pathname as key.

**Step 2: Wrap children in layout.tsx**

```tsx
<PageTransition>
  {children}
</PageTransition>
```

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/page-transition.tsx src/app/[locale]/layout.tsx
git commit -m "feat: add page transition animations"
```

---

### Task 20: Final build, test, and cleanup

**Files:** Various (lint fixes, unused import removal)

**Step 1: Run full test suite**

Run: `npm test`
Expected: All 35+ tests pass

**Step 2: Run lint**

Run: `npm run lint`
Fix any lint errors.

**Step 3: Full build**

Run: `npm run build`
Expected: Clean build with no warnings.

**Step 4: Manual verification checklist**

- [ ] Home page: featured hero, horizontal carousels, FAB opens import sheet
- [ ] Recipe detail: full-bleed image, content sheet, tabs work
- [ ] Cooking mode: swipe navigation, wake lock, timer works
- [ ] Generate: tappable chips auto-fill, shimmer loading
- [ ] Meal plan: vertical day layout, bottom sheet recipe picker
- [ ] Grocery: category emojis, progress bar, share button
- [ ] Settings: iOS-style rows
- [ ] Bottom nav: 4 tabs, pill animation, frosted glass
- [ ] Dark mode: all pages look correct
- [ ] Arabic: RTL works correctly on all pages
- [ ] PWA: manifest loads, service worker registers

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final polish and cleanup for visual redesign"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Foundation: deps, color tokens, spacing |
| 2 | 4-5 | App shell: bottom nav, header |
| 3 | 6-8 | Shared: bottom sheet, FAB, recipe card |
| 4 | 9 | Home page redesign |
| 5 | 10 | Recipe detail redesign |
| 6 | 11 | Cooking mode enhancement |
| 7 | 12 | Generate page redesign |
| 8 | 13 | Import → redirect (bottom sheet on home) |
| 9 | 14 | Meal plan redesign |
| 10 | 15 | Grocery list redesign |
| 11 | 16 | Settings redesign |
| 12 | 17-18 | PWA setup |
| 13 | 19-20 | Final polish |

**Total: 20 tasks across 13 phases**
**Estimated new/modified files: ~18**
**New dependencies: framer-motion, @serwist/next, serwist**
