# Cooking Mode Animations & Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the static cooking mode into a lively experience with step transitions, contextual cooking icons, a circular timer ring, and a completion screen with star rating + share.

**Architecture:** Pure CSS keyframe animations + Lucide icons for contextual visuals. SVG circle for timer ring. No new dependencies. The cook page (`src/app/[locale]/cook/[id]/page.tsx`) gets a near-complete rewrite while keeping the same state logic. A `rating` field is added to the Recipe type for the completion screen.

**Tech Stack:** React 19, CSS keyframes, SVG, Lucide icons, next-intl, Dexie (IndexedDB), Web Share API.

---

### Task 1: Add i18n keys and rating field

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/types/recipe.ts`

**Step 1: Add cook i18n keys to en.json**

Replace lines 51-57 (the `"cook"` section) with:

```json
  "cook": {
    "step": "Step {current} of {total}",
    "next": "Next Step",
    "previous": "Previous",
    "done": "Done!",
    "timer": "{minutes} min",
    "startTimer": "Start {minutes} min timer",
    "pause": "Pause",
    "resume": "Resume",
    "timesUp": "Time's up!",
    "wellDone": "Well Done!",
    "youCooked": "You just cooked",
    "rateRecipe": "How was it?",
    "shareRecipe": "Share",
    "copied": "Copied to clipboard!",
    "backToRecipe": "Back to Recipe"
  },
```

**Step 2: Add cook i18n keys to ar.json**

Replace lines 51-57 (the `"cook"` section) with:

```json
  "cook": {
    "step": "الخطوة {current} من {total}",
    "next": "الخطوة التالية",
    "previous": "السابقة",
    "done": "تم!",
    "timer": "{minutes} دقيقة",
    "startTimer": "ابدأ مؤقت {minutes} دقيقة",
    "pause": "إيقاف",
    "resume": "استمرار",
    "timesUp": "انتهى الوقت!",
    "wellDone": "أحسنت!",
    "youCooked": "لقد طبخت للتو",
    "rateRecipe": "كيف كانت؟",
    "shareRecipe": "مشاركة",
    "copied": "تم النسخ!",
    "backToRecipe": "العودة للوصفة"
  },
```

**Step 3: Add rating field to Recipe type**

In `src/types/recipe.ts`, add `rating?: number` after line 18 (`updatedAt: Date`):

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
  rating?: number
}
```

**Step 4: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/messages/en.json src/messages/ar.json src/types/recipe.ts
git commit -m "feat: add cooking animation i18n keys and rating field

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Add CSS keyframe animations to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Context:** The cook page needs ~10 unique CSS keyframe animations for contextual cooking icons, plus animations for step transitions, confetti, and the completion checkmark. All go at the bottom of globals.css in a `@layer components` block.

**Step 1: Add all cooking animations**

Append the following after the existing `@layer base` block (after line 128) in `src/app/globals.css`:

```css
/* Cooking mode animations */
@keyframes cook-chop {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(-5deg); }
  50% { transform: translateY(4px) rotate(2deg); }
  75% { transform: translateY(-4px) rotate(-2deg); }
}

@keyframes cook-stir {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes cook-flame {
  0%, 100% { transform: scale(1); opacity: 0.15; }
  25% { transform: scale(1.1) translateY(-2px); opacity: 0.2; }
  50% { transform: scale(0.95); opacity: 0.12; }
  75% { transform: scale(1.08) translateY(-3px); opacity: 0.18; }
}

@keyframes cook-sizzle {
  0%, 100% { transform: translateX(0) scale(1); }
  10% { transform: translateX(-2px) scale(1.02); }
  20% { transform: translateX(2px) scale(0.98); }
  30% { transform: translateX(-1px) scale(1.01); }
  40% { transform: translateX(1px) scale(0.99); }
  50% { transform: translateX(0) scale(1.03); }
  60% { transform: translateX(-2px) scale(0.97); }
  70% { transform: translateX(1px) scale(1.02); }
  80% { transform: translateX(-1px) scale(0.98); }
  90% { transform: translateX(2px) scale(1.01); }
}

@keyframes cook-pour {
  0%, 100% { transform: translateY(0); opacity: 0.15; }
  50% { transform: translateY(8px); opacity: 0.1; }
}

@keyframes cook-wait {
  0%, 100% { transform: scale(1); opacity: 0.12; }
  50% { transform: scale(1.05); opacity: 0.18; }
}

@keyframes cook-bounce {
  0%, 100% { transform: scale(1) translateY(0); }
  30% { transform: scale(1.1) translateY(-6px); }
  60% { transform: scale(0.95) translateY(2px); }
}

@keyframes cook-scatter {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.15; }
  25% { transform: scale(1.1) rotate(5deg); opacity: 0.2; }
  50% { transform: scale(0.9) rotate(-5deg); opacity: 0.1; }
  75% { transform: scale(1.05) rotate(3deg); opacity: 0.18; }
}

@keyframes cook-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes cook-step-in-right {
  from { transform: translateX(40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes cook-step-in-left {
  from { transform: translateX(-40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes cook-checkmark {
  0% { transform: scale(0) rotate(-45deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes cook-confetti-fall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

@keyframes cook-ring-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

**Step 2: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add CSS keyframe animations for cooking mode

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Rewrite cooking mode page with all animations

**Files:**
- Modify: `src/app/[locale]/cook/[id]/page.tsx`

**Context:** This is the main change. Replace the entire cook page with the animated version. The page keeps the same state management pattern (useRecipes, useParams, timer logic, swipe handling) but adds: step transitions with direction-aware slide animations, contextual cooking icons via keyword detection, SVG circular timer ring, and a completion screen with star rating + Web Share API.

**Step 1: Replace the entire cook page**

Replace the contents of `src/app/[locale]/cook/[id]/page.tsx` with:

```tsx
'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import {
  X, ChevronLeft, ChevronRight, Play, Pause, Timer,
  Flame, Droplets, ChefHat, Sparkles, Clock, UtensilsCrossed,
  CookingPot, Check, Share2, ArrowLeft, Star,
} from 'lucide-react'
import type { Recipe } from '@/types/recipe'

// --- Contextual icon mapping ---
type CookAction = {
  icon: React.ElementType
  animation: string
  duration: string
}

const COOK_ACTIONS: { keywords: string[]; action: CookAction }[] = [
  {
    keywords: ['chop', 'cut', 'dice', 'slice', 'mince'],
    action: { icon: UtensilsCrossed, animation: 'cook-chop', duration: '0.8s' },
  },
  {
    keywords: ['stir', 'mix', 'whisk', 'combine', 'fold'],
    action: { icon: UtensilsCrossed, animation: 'cook-stir', duration: '2s' },
  },
  {
    keywords: ['fry', 'sauté', 'saute', 'sear', 'pan'],
    action: { icon: Flame, animation: 'cook-sizzle', duration: '0.6s' },
  },
  {
    keywords: ['boil', 'simmer', 'heat', 'warm', 'cook'],
    action: { icon: Flame, animation: 'cook-flame', duration: '1.5s' },
  },
  {
    keywords: ['bake', 'oven', 'roast', 'broil'],
    action: { icon: Flame, animation: 'cook-wait', duration: '2s' },
  },
  {
    keywords: ['pour', 'add', 'drizzle', 'liquid', 'water', 'oil'],
    action: { icon: Droplets, animation: 'cook-pour', duration: '1.5s' },
  },
  {
    keywords: ['wait', 'rest', 'cool', 'set', 'chill', 'refrigerate'],
    action: { icon: Clock, animation: 'cook-wait', duration: '2s' },
  },
  {
    keywords: ['serve', 'plate', 'garnish', 'arrange'],
    action: { icon: ChefHat, animation: 'cook-bounce', duration: '1s' },
  },
  {
    keywords: ['season', 'sprinkle', 'salt', 'pepper', 'spice'],
    action: { icon: Sparkles, animation: 'cook-scatter', duration: '1.2s' },
  },
]

const DEFAULT_ACTION: CookAction = {
  icon: CookingPot,
  animation: 'cook-float',
  duration: '2.5s',
}

function detectCookAction(instruction: string): CookAction {
  const lower = instruction.toLowerCase()
  for (const { keywords, action } of COOK_ACTIONS) {
    if (keywords.some((kw) => lower.includes(kw))) return action
  }
  return DEFAULT_ACTION
}

// --- Timer Ring SVG ---
function TimerRing({
  seconds,
  totalSeconds,
  finished,
}: {
  seconds: number
  totalSeconds: number
  finished: boolean
}) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? seconds / totalSeconds : 0
  const offset = circumference * (1 - progress)

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={finished ? { animation: 'cook-ring-pulse 1s ease-in-out infinite' } : undefined}
    >
      <svg width="140" height="140" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          className={finished ? 'text-destructive' : seconds <= 10 && seconds > 0 ? 'text-secondary' : 'text-primary'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="absolute font-mono text-3xl font-bold">
        {formatTime(seconds)}
      </span>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// --- Confetti ---
function Confetti() {
  const pieces = useMemo(() => {
    const colors = [
      'bg-primary', 'bg-secondary', 'bg-destructive',
      'bg-primary/70', 'bg-secondary/70',
    ]
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1.5}s`,
      duration: `${1.5 + Math.random() * 2}s`,
      size: `${4 + Math.random() * 6}px`,
      color: colors[i % colors.length],
    }))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-sm ${p.color}`}
          style={{
            left: p.left,
            top: '-10px',
            width: p.size,
            height: p.size,
            animation: `cook-confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

// --- Star Rating ---
function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={`h-10 w-10 ${
              star <= value
                ? 'fill-secondary text-secondary'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// --- Main Page ---
export default function CookingModePage() {
  const params = useParams<{ id: string }>()
  const locale = useLocale()
  const t = useTranslations('cook')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { getRecipe, updateRecipe } = useRecipes()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward')
  const [animKey, setAnimKey] = useState(0)

  // Completion state
  const [completed, setCompleted] = useState(false)
  const [rating, setRating] = useState(0)
  const [shareMessage, setShareMessage] = useState('')

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Swipe support
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    async function load() {
      const r = await getRecipe(params.id)
      if (r) setRecipe(r)
      setLoading(false)
    }
    load()
  }, [params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const steps = recipe?.steps ?? []
  const totalSteps = steps.length
  const step = steps[currentStep]
  const isRtl = locale === 'ar'

  // Reset timer when step changes
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimerRunning(false)
    setTimerFinished(false)
    if (step?.duration) {
      const total = step.duration * 60
      setTimerSeconds(total)
      setTimerTotal(total)
    } else {
      setTimerSeconds(0)
      setTimerTotal(0)
    }
  }, [currentStep, step?.duration])

  // Timer countdown
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            setTimerFinished(true)
            if (intervalRef.current) clearInterval(intervalRef.current)
            // Vibrate if supported
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([200, 100, 200])
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerRunning, timerSeconds])

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setSlideDirection('forward')
      setAnimKey((k) => k + 1)
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, totalSteps])

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setSlideDirection('backward')
      setAnimKey((k) => k + 1)
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX
      const diff = touchStartX.current - touchEndX.current
      const threshold = 50

      if (Math.abs(diff) < threshold) return

      if (isRtl) {
        if (diff < -threshold) goNext()
        else if (diff > threshold) goPrev()
      } else {
        if (diff > threshold) goNext()
        else if (diff < -threshold) goPrev()
      }
    },
    [isRtl, goNext, goPrev],
  )

  function handleClose() {
    router.back()
  }

  function handleDone() {
    setCompleted(true)
  }

  async function handleRate(value: number) {
    setRating(value)
    if (recipe) {
      await updateRecipe(recipe.id, { rating: value })
    }
  }

  async function handleShare() {
    const title = locale === 'ar' && recipe?.titleAr ? recipe.titleAr : recipe?.title || ''
    const text = `${t('youCooked')} ${title}! 🍳`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      setShareMessage(t('copied'))
      setTimeout(() => setShareMessage(''), 2000)
    }
  }

  function startTimer() {
    if (timerSeconds > 0) {
      setTimerRunning(true)
      setTimerFinished(false)
    }
  }

  function toggleTimer() {
    setTimerRunning((prev) => !prev)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      </div>
    )
  }

  if (!recipe || totalSteps === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Recipe not found</p>
          <Button variant="link" onClick={handleClose} className="mt-4">
            {tCommon('home')}
          </Button>
        </div>
      </div>
    )
  }

  // --- Completion Screen ---
  if (completed) {
    const title = locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
        <Confetti />

        {/* Checkmark */}
        <div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary"
          style={{ animation: 'cook-checkmark 0.6s ease-out forwards' }}
        >
          <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
        </div>

        {/* Text */}
        <h2 className="mb-1 text-2xl font-bold">{t('wellDone')}</h2>
        <p className="mb-8 text-muted-foreground">
          {t('youCooked')} <span className="font-medium text-foreground">{title}</span>
        </p>

        {/* Rating */}
        <p className="mb-3 text-sm text-muted-foreground">{t('rateRecipe')}</p>
        <StarRating value={rating} onChange={handleRate} />

        {/* Share */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            {t('shareRecipe')}
          </Button>
          {shareMessage && (
            <span className="text-xs text-primary">{shareMessage}</span>
          )}
        </div>

        {/* Back */}
        <Button variant="ghost" onClick={handleClose} className="mt-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('backToRecipe')}
        </Button>
      </div>
    )
  }

  // --- Step View ---
  const instruction =
    locale === 'ar' && step.instructionAr ? step.instructionAr : step.instruction
  const progressPercent = ((currentStep + 1) / totalSteps) * 100
  const isLastStep = currentStep === totalSteps - 1
  const cookAction = detectCookAction(step.instruction)
  const ActionIcon = cookAction.icon

  const slideAnim = isRtl
    ? slideDirection === 'forward' ? 'cook-step-in-left' : 'cook-step-in-right'
    : slideDirection === 'forward' ? 'cook-step-in-right' : 'cook-step-in-left'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {t('step', { current: currentStep + 1, total: totalSteps })}
        </span>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-muted">
        <div
          className="h-full rounded-r-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step content with slide animation */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6">
        {/* Contextual background icon */}
        <ActionIcon
          className="absolute text-primary/[0.08]"
          style={{
            width: '160px',
            height: '160px',
            animation: `${cookAction.animation} ${cookAction.duration} ease-in-out infinite`,
          }}
        />

        {/* Animated step content */}
        <div
          key={animKey}
          className="relative z-10 flex flex-col items-center"
          style={{ animation: `${slideAnim} 0.3s ease-out` }}
        >
          {/* Step number circle */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
            {step.order}
          </div>

          {/* Step instruction */}
          <p className="max-w-lg text-center text-2xl leading-relaxed">{instruction}</p>

          {/* Timer section */}
          {step.duration && (
            <div className="mt-8 flex flex-col items-center gap-3">
              {!timerRunning && !timerFinished && timerSeconds === timerTotal && (
                <Button onClick={startTimer} variant="outline" className="gap-2">
                  <Timer className="h-4 w-4" />
                  {t('startTimer', { minutes: step.duration })}
                </Button>
              )}

              {(timerRunning || (timerSeconds > 0 && timerSeconds < timerTotal)) && (
                <div className="flex flex-col items-center gap-3">
                  <TimerRing
                    seconds={timerSeconds}
                    totalSeconds={timerTotal}
                    finished={false}
                  />
                  <Button onClick={toggleTimer} variant="outline" size="sm" className="gap-2">
                    {timerRunning ? (
                      <>
                        <Pause className="h-4 w-4" />
                        {t('pause')}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        {t('resume')}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {timerFinished && (
                <div className="flex flex-col items-center gap-1">
                  <TimerRing seconds={0} totalSeconds={timerTotal} finished />
                  <p className="mt-2 text-sm font-semibold text-destructive">
                    {t('timesUp')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between border-t px-4 py-4">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('previous')}
        </Button>

        {isLastStep ? (
          <Button onClick={handleDone} className="gap-2">
            {t('done')}
          </Button>
        ) : (
          <Button onClick={goNext} className="gap-2">
            {t('next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
```

**What changed from the original:**
- **New imports**: `useMemo`, `Flame`, `Droplets`, `ChefHat`, `Sparkles`, `Clock`, `UtensilsCrossed`, `CookingPot`, `Check`, `Share2`, `ArrowLeft`, `Star`
- **New**: `detectCookAction()` function with keyword → icon/animation mapping
- **New**: `TimerRing` SVG component replacing plain text timer
- **New**: `Confetti` component for completion screen
- **New**: `StarRating` component for rating
- **New state**: `slideDirection`, `animKey`, `completed`, `rating`, `shareMessage`, `timerTotal`
- **New**: `handleDone()`, `handleRate()`, `handleShare()` functions
- **Changed**: `goNext`/`goPrev` now set `slideDirection` and bump `animKey`
- **Changed**: Step content wrapped in animated `div` with `key={animKey}`
- **Changed**: Background icon renders behind step text with contextual animation
- **Changed**: Timer uses `TimerRing` SVG instead of plain text
- **Changed**: "Done!" button calls `handleDone()` instead of `handleClose()`
- **Changed**: Progress bar is thicker (`h-1.5`) with rounded end
- **New**: Completion screen with confetti + checkmark + rating + share

**Step 2: Verify the app builds**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/[locale]/cook/[id]/page.tsx
git commit -m "feat: animated cooking mode with contextual icons, timer ring, completion screen

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Build, push, and deploy

**Step 1: Full build verification**

Run: `cd /Users/mbh/Desktop/Clone_app && npm run build`
Expected: Build succeeds with no errors.

**Step 2: Push and deploy**

```bash
git push origin feature/recipe-app-mvp
vercel --prod --yes
```

**Step 3: Test the cooking mode**

1. Go to https://farah-ai-two.vercel.app/en/recipes (pick any recipe)
2. Tap "Start Cooking"
3. Verify: contextual icon animates behind step text (flame for "heat", knife for "chop", etc.)
4. Verify: swiping/tapping Next slides the step in from the right
5. Verify: swiping/tapping Previous slides the step in from the left
6. If a step has a timer: verify circular ring appears, depletes, pulses red when done
7. On the last step: tap "Done!" → confetti + checkmark + rating stars + share button
8. Tap stars → verify rating saves
9. Tap "Share" → verify native share sheet (mobile) or clipboard copy (desktop)
10. Tap "Back to Recipe" → returns to recipe detail
11. Switch to Arabic (`/ar/`) and repeat — verify RTL slide directions are correct
