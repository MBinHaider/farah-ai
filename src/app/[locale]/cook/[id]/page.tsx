'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useRecipes } from '@/hooks/use-recipes'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight, Play, Pause, Timer } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

export default function CookingModePage() {
  const params = useParams<{ id: string }>()
  const locale = useLocale()
  const t = useTranslations('cook')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { getRecipe } = useRecipes()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0)
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
      setTimerSeconds(step.duration * 60)
    } else {
      setTimerSeconds(0)
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
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, totalSteps])

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
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
        // RTL: swipe right (negative diff) goes next, swipe left goes prev
        if (diff < -threshold) goNext()
        else if (diff > threshold) goPrev()
      } else {
        // LTR: swipe left (positive diff) goes next, swipe right goes prev
        if (diff > threshold) goNext()
        else if (diff < -threshold) goPrev()
      }
    },
    [isRtl, goNext, goPrev]
  )

  function handleClose() {
    router.back()
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

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
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

  const instruction =
    locale === 'ar' && step.instructionAr ? step.instructionAr : step.instruction
  const progressPercent = ((currentStep + 1) / totalSteps) * 100
  const isLastStep = currentStep === totalSteps - 1

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
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Step number circle */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
          {step.order}
        </div>

        {/* Step instruction */}
        <p className="max-w-lg text-center text-2xl leading-relaxed">{instruction}</p>

        {/* Timer section */}
        {step.duration && (
          <div className="mt-8 flex flex-col items-center gap-3">
            {!timerRunning && !timerFinished && timerSeconds === step.duration * 60 && (
              <Button onClick={startTimer} variant="outline" className="gap-2">
                <Timer className="h-4 w-4" />
                {t('timer', { minutes: step.duration })}
              </Button>
            )}

            {(timerRunning || (timerSeconds > 0 && timerSeconds < step.duration * 60)) && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl font-mono font-bold">
                  {formatTime(timerSeconds)}
                </span>
                <Button onClick={toggleTimer} variant="outline" size="sm" className="gap-2">
                  {timerRunning ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  )}
                </Button>
              </div>
            )}

            {timerFinished && (
              <div className="animate-pulse text-center">
                <span className="text-4xl font-mono font-bold text-primary">0:00</span>
                <p className="mt-1 text-sm font-medium text-primary">Time&apos;s up!</p>
              </div>
            )}
          </div>
        )}
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
          <Button onClick={handleClose} className="gap-2">
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
