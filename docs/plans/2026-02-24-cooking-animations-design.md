# Cooking Mode Animations & Polish — Design

**Goal:** Transform the cooking mode from static step-by-step into a lively, engaging experience with contextual animations, smooth transitions, an enhanced timer, and a rewarding completion screen.

**Approach:** CSS keyframe animations + Lucide icons. Zero new dependencies.

---

## Problem

The current cooking mode is functional but static — steps pop in/out with no motion, the timer is plain text, and there's no sense of accomplishment when you finish. It feels like reading a list, not cooking.

## Solution

Four enhancements that make the cooking experience feel alive:

### 1. Step Transitions

Smooth slide + fade when navigating between steps:
- **Forward (Next/swipe)**: Old step slides out left, new step slides in from right
- **Backward (Previous/swipe)**: Opposite direction
- **RTL-aware**: Directions flip for Arabic
- **Duration**: 300ms, ease-out curve
- **Implementation**: CSS transition on wrapper with `translateX` + `opacity`. A `direction` state tracks forward/backward.

### 2. Contextual Step Icons

Each step gets a large animated icon based on keyword detection from the English instruction:

| Keywords | Icon | Animation |
|----------|------|-----------|
| chop, cut, dice, slice, mince | `Utensils` | Chopping bounce (translateY) |
| stir, mix, whisk, combine, fold | `Utensils` | Slow rotation (360deg) |
| boil, simmer, heat, warm, cook | `Flame` | Flicker (scale + opacity) |
| bake, oven, roast | `Flame` | Slow glow pulse |
| fry, sauté, sear, pan | `Flame` | Shake + flicker |
| pour, add, drizzle, liquid | `Droplets` | Falling motion (translateY) |
| wait, rest, cool, set, chill | `Clock` | Gentle pulse |
| serve, plate, garnish | `ChefHat` | Bounce in (scale) |
| season, sprinkle, salt, pepper, spice | `Sparkles` | Scatter (multi-direction) |
| Default (no keyword match) | `CookingPot` | Gentle float (translateY oscillation) |

**Style**: Bold & playful. Icons render at ~120px, semi-transparent behind step text but visually prominent. Each has a unique CSS keyframe animation.

**Detection**: Simple `.toLowerCase().includes()` on the English `instruction` field (always present).

### 3. Timer Ring

Replace plain text timer with a circular SVG progress ring:
- **Ring**: SVG circle with `stroke-dashoffset` animation
- **Depletes clockwise** as time passes
- **Color**: Primary green, turns to warning color in last 10 seconds
- **Center**: Large mono font showing remaining time
- **Completion**: Ring pulses, phone vibrates via `navigator.vibrate()`
- **Controls**: Play/pause buttons below the ring

### 4. Completion Screen (Rating + Share)

When user taps "Done!" on the last step:

1. **Celebration**: Animated checkmark scales in with bounce + CSS confetti burst (30+ small colored elements with randomized positions/delays)
2. **Heading**: "Well done!" + recipe title
3. **Star rating**: 5 tappable stars. Rating saves to recipe via `updateRecipe(id, { rating })` in IndexedDB
4. **Share button**: Uses Web Share API on mobile (native share sheet). Falls back to "Copy to clipboard" on desktop. Text: "I just cooked [Recipe Name] with Farah AI!"
5. **"Back to recipe" button**: Navigates back

## Files to Modify

| File | Change |
|------|--------|
| `src/app/[locale]/cook/[id]/page.tsx` | Step transitions, contextual icons, timer ring, completion screen |
| `src/app/globals.css` | CSS keyframe animations (~10 cooking animations + confetti) |
| `src/types/recipe.ts` | Add `rating?: number` field |
| `src/messages/en.json` | New i18n keys (wellDone, rateRecipe, shareRecipe, etc.) |
| `src/messages/ar.json` | Arabic translations for new keys |

## What We Reuse

- `updateRecipe()` from `useRecipes` hook — already exists, saves to IndexedDB
- Lucide icons — already installed (`Flame`, `Droplets`, `ChefHat`, `Sparkles`, `Clock`, `Utensils`, `CookingPot`)
- All existing timer logic — enhanced, not replaced
- Swipe/navigation logic — unchanged, just wrapped in transition

## New Dependencies

None. Pure CSS + existing Lucide icons.
