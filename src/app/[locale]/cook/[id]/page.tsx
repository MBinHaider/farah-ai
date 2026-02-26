'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, Play, Pause, Timer,
  Flame, Droplets, ChefHat, Sparkles, Clock, UtensilsCrossed,
  CookingPot, Check, Share2, ArrowLeft, Star, Square, CircleCheck,
} from 'lucide-react'
import type { Recipe } from '@/types/recipe'

// --- Framer Motion step transition variants ---
const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -200 : 200, opacity: 0 }),
}

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
  const [direction, setDirection] = useState(0) // +1 forward, -1 backward

  // Completion state
  const [completed, setCompleted] = useState(false)
  const [rating, setRating] = useState(0)
  const [shareMessage, setShareMessage] = useState('')
  const [ingredientChecked, setIngredientChecked] = useState<Record<string, boolean>>({})

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Reset timer and ingredient checks when step changes
  useEffect(() => {
    setIngredientChecked({})
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
      setDirection(isRtl ? -1 : 1)
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, totalSteps, isRtl])

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(isRtl ? 1 : -1)
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep, isRtl])

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info
      if (isRtl) {
        // RTL: swipe right (positive offset) = next, swipe left (negative) = prev
        if (offset.x > 100 || velocity.x > 500) goNext()
        else if (offset.x < -100 || velocity.x < -500) goPrev()
      } else {
        // LTR: swipe left (negative offset) = next, swipe right (positive) = prev
        if (offset.x < -100 || velocity.x < -500) goNext()
        else if (offset.x > 100 || velocity.x > 500) goPrev()
      }
    },
    [isRtl, goNext, goPrev],
  )

  // Wake lock: keep screen on during cooking
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null

    async function acquireWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch {
        // Wake lock not supported or permission denied
      }
    }

    acquireWakeLock()

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        acquireWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock) {
        wakeLock.release().catch(() => {})
      }
    }
  }, [])

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar — minimal, no border */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {t('step', { current: currentStep + 1, total: totalSteps })}
        </span>
        <Button variant="ghost" size="icon" onClick={handleClose} className="h-11 w-11">
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

      {/* Step content with Framer Motion drag + AnimatePresence */}
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

        {/* Draggable + animated step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative z-10 flex w-full flex-col items-center"
          >
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
              <p className="max-w-lg text-center text-xl leading-relaxed md:text-2xl">{instruction}</p>
            )}

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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons — no border */}
      <div className="flex items-center justify-between px-4 py-4">
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
