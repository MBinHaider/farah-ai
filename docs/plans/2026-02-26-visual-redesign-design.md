# Farah AI — Visual Redesign (PWA Native Experience)

**Date**: 2026-02-26
**Goal**: Full visual redesign to make Farah AI feel like a native mobile cooking app — not a web app viewed on a phone.
**Approach**: PWA Native Experience (Approach C) — mobile-first layouts, Framer Motion animations, gesture support, PWA install/offline features.

---

## Design Brief

| Dimension | Direction |
|-----------|-----------|
| **Primary user** | Smartphone users — the app must feel phone-native |
| **Inspiration** | Mealime/Paprika (food-focused cards, big photos) + Apple Health (native iOS polish, rounded cards, animations) |
| **Palette** | Lavender purple accent + warm cream/amber base + clean neutrals |
| **Scope** | All pages — full redesign |
| **Motion** | Essential — Framer Motion throughout, gesture navigation, micro-interactions |

---

## 1. Design System

### Color Palette

**Light mode** — warm cream base that makes food pop:

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `hsl(30, 30%, 98%)` | Warm off-white page bg |
| `card` / `surface` | `hsl(30, 20%, 100%)` | White cards float on cream |
| `subtle` | `hsl(30, 20%, 96%)` | Slightly tinted sections |
| `primary` | `hsl(270, 60%, 65%)` | Lavender purple (brand) |
| `primary-hover` | `hsl(270, 60%, 55%)` | Deeper on interaction |
| `accent-warm` | `hsl(25, 80%, 55%)` | Amber/terracotta for food CTAs |
| `foreground` | `hsl(270, 10%, 15%)` | Near-black with purple tint |
| `muted-foreground` | `hsl(270, 5%, 45%)` | Metadata text |
| `border` | `hsl(30, 15%, 90%)` | Warm subtle borders |

**Dark mode** — rich dark that makes food glow:

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `hsl(270, 15%, 8%)` | Deep purple-black |
| `card` / `surface` | `hsl(270, 12%, 12%)` | Elevated card |
| `primary` | `hsl(270, 70%, 72%)` | Brighter lavender |
| `accent-warm` | `hsl(25, 85%, 60%)` | Warmer amber |
| `foreground` | `hsl(30, 10%, 95%)` | Warm white text |

### Typography

- **Headings**: Plus Jakarta Sans 700 (EN) / Cairo 700 (AR)
- **Body**: Plus Jakarta Sans 400-500 / Cairo 400-500
- **Scale** (mobile-first): 14px body, 16px subheading, 20px heading, 28px display
- **Line height**: 1.5 body, 1.2 headings

### Spacing & Radius

- **Mobile padding**: 16px page gutters
- **Card radius**: 16px (large, soft, iOS-like)
- **Button radius**: 12px
- **Input radius**: 12px
- **Shadows**: `0 2px 8px hsl(30, 20%, 85%, 0.3)` (warm subtle)

---

## 2. App Shell — Navigation & Layout

### Bottom Navigation (4 tabs)

- **Tabs**: Home, Generate, Plan, Settings (removed Grocery — moved inside Plan)
- **Style**: Frosted glass (backdrop-blur + semi-transparent background)
- **Active indicator**: Filled pill shape behind active icon + label, primary color
- **Tap animation**: Scale 0.92 → 1.0 (100ms spring)
- **Safe area**: Bottom padding for device notch/home indicator

### Import → Floating Action Button (FAB)

- **Position**: Bottom-right, above nav bar (Home page only)
- **Style**: Primary color circle with + icon
- **Tap**: Opens import bottom sheet (not a full page)
- **Animation**: Scale 0.85 → 1.1 → 1.0 (bounce)

### Header (Minimal, Contextual)

- **Home**: "Farah AI" logo + expandable search icon
- **Other pages**: Back arrow + page title (inline)
- **Scroll behavior**: Hides on scroll down, reveals on scroll up

### Page Transitions

- **Tab switch**: Crossfade (150ms)
- **Forward nav**: Slide up from bottom as sheet (300ms spring)
- **Back nav**: Slide down, fade out (250ms)
- **Cook mode**: Slide up, full screen (350ms spring)
- **Bottom sheets**: Slide up with backdrop dim (250ms), swipe down to dismiss

---

## 3. Home Page

### Layout (top to bottom)

1. **Minimal header**: "Farah AI" + search icon (expandable on tap)
2. **Featured recipe**: Full-width image with gradient overlay, title + metadata at bottom
3. **Quick Actions**: Two pill buttons — "✨ Ask AI" + "🎥 From Video"
4. **Category carousels**: Horizontal-scrolling recipe cards
   - "Your Recipes" (all), "Soups", "Salads"
   - Show 2.5 cards visible to hint scrolling
5. **FAB**: Bottom-right (+) for import

### Recipe Cards (Carousel)

- Portrait format: Image on top, title + time below
- Compact size for horizontal scrolling
- Tap animation: Scale 0.97 + shadow lift
- Long press: Quick actions menu (Edit, Delete, Add to Plan)

---

## 4. Recipe Detail Page

### Layout

1. **Full-bleed hero image** (40% viewport height)
   - Floating back button + delete/more menu on image
2. **Content sheet** overlapping image (rounded top corners, draggable)
   - Title (large, bold)
   - Metadata line: ⏱ time · 🍽 servings · 🔥 calories · 🥩 protein
   - Description
   - Servings stepper (inline [ - ] N [ + ])
   - Tab switcher: Ingredients | Steps
   - Ingredients grouped by category with emoji icons
   - Steps with sub-actions and ingredient callouts
3. **Sticky bottom CTA**: "🍳 Start Cooking" (always visible)

---

## 5. Cooking Mode

### Full-Screen Immersive

- **Top bar**: Close (✕) + "Step N of M" (minimal)
- **Progress bar**: Filled to current step
- **Step text**: Large (20px+), high contrast, readable at arm's length
- **Timer**: Auto-starts for steps with duration, large tap target
- **Ingredients used**: Listed below step text
- **Navigation**: Swipe left/right (primary) + Prev/Next buttons (fallback)
- **Features**: Wake lock (screen stays on), no nav bar/header

---

## 6. Generate Page

- Friendly prompt card: "What would you like to cook today?"
- Text area for description
- **Tappable suggestion chips** that auto-fill the text area
- Loading: Shimmer skeleton + sparkle animation (not plain spinner)

---

## 7. Import (Bottom Sheet)

- Triggered from FAB (+ button on Home)
- Bottom sheet with drag handle, swipe-down to dismiss
- Two sections: "📋 Paste recipe text" + "🔗 Import from URL"
- URL hints: "YouTube · TikTok · Instagram"
- Single "📥 Import Recipe" button

---

## 8. Meal Plan Page

- **Vertical day layout** (not grid — phone-native)
- **Swipeable week navigation** (◀ This Week ▶)
- **Day sections**: Mon-Sun, each with Breakfast/Lunch/Dinner/Snack slots
- **"+ Add" buttons** open recipe picker as bottom sheet
- **Compact meal cards** with recipe photo + name + servings + remove (✕)
- **Sticky bottom CTA**: "🛒 View Grocery List"

---

## 9. Grocery List Page

- Items grouped by category with emoji icons (🥕 Produce, 🧈 Dairy, etc.)
- Checkboxes with swipe-to-check option
- Checked items get strikethrough styling
- Progress indicator: "N of M items checked"
- **Share button**: Native Web Share API (WhatsApp, Messages, etc.)

---

## 10. Settings Page

- **iOS Settings style**: Grouped rows with chevrons
- **Sections**: Appearance (Language, Theme), Data (Export, Import), About
- Tappable rows open pickers/actions

---

## 11. Animations & Micro-Interactions

### Library: Framer Motion

| Element | Interaction | Animation |
|---------|-------------|-----------|
| Bottom nav tap | Press | Scale 0.92 → 1.0 (100ms spring) |
| Recipe card tap | Press | Scale 0.97 → 1.0 + shadow lift |
| FAB tap | Press | Scale 0.85 → 1.1 → 1.0 (bounce) |
| Button tap | Press | Scale 0.95 → 1.0 (80ms) |
| Checkbox toggle | Check | Scale 0.8 → 1.1 → 1.0 + checkmark draw |
| Servings +/- | Tap | Number slides out/in |
| Cooking steps | Swipe L/R | Spring physics page slide |
| Bottom sheet | Open/close | Slide up/down + backdrop fade |
| Delete recipe | Swipe left | Slide out + red background |
| Pull to refresh | Pull down | Elastic pull + spinner |

### Loading States

| Context | Animation |
|---------|-----------|
| AI generating | Shimmer skeleton + sparkle pulse |
| Importing URL/video | Progress bar + status text |
| Recipe cards | Skeleton cards with shimmer |
| Images | Blur-up placeholder → sharp |

### Gestures

- Swipe left/right: Cooking step navigation
- Swipe down: Dismiss bottom sheets/modals
- Swipe between weeks: Meal plan
- Long press recipe card: Quick actions
- Pull down: Refresh

---

## 12. PWA Features

### Manifest

- **App name**: "Farah AI"
- **Short name**: "Farah"
- **Theme color**: `hsl(270, 60%, 65%)`
- **Background color**: `hsl(30, 30%, 98%)`
- **Display**: `standalone`
- **Orientation**: `portrait`

### Install Experience

- Custom install banner after 2nd visit
- "Add Farah AI to your home screen for the best experience"

### Offline Support

- Service Worker caches static assets, fonts, app shell
- Subtle offline banner: "You're offline. Your recipes are still available."
- IndexedDB already works offline (recipes, plans, groceries)
- API calls show reconnect message when offline

### Additional

- **Splash screen**: Lavender background + logo
- **Status bar**: Translucent with lavender tint
- **Wake lock**: Keep screen on during cooking mode
- **Share target**: Register so users can share URLs directly to Farah AI

---

## Technical Dependencies

### New packages needed

- `framer-motion` — Animations and gestures
- `next-pwa` or `@serwist/next` — PWA service worker and manifest
- No other new dependencies expected

### Existing stack (unchanged)

- Next.js 16 App Router
- Tailwind CSS 4 + shadcn/ui (restyled)
- Dexie (IndexedDB)
- next-intl (i18n)
- next-themes (dark mode)
