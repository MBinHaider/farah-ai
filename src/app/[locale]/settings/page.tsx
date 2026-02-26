'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter, usePathname } from '@/i18n/routing'
import { useTheme } from 'next-themes'
import { db } from '@/lib/db'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Globe,
  Palette,
  ChevronRight,
  Info,
} from 'lucide-react'
import { useRef, useState } from 'react'

const THEME_ORDER = ['light', 'dark', 'system'] as const

export default function SettingsPage() {
  const locale = useLocale()
  const t = useTranslations('settings')
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function switchLocale(newLocale: 'en' | 'ar') {
    router.replace(pathname, { locale: newLocale })
  }

  function toggleLocale() {
    switchLocale(locale === 'en' ? 'ar' : 'en')
  }

  function cycleTheme() {
    const currentIndex = THEME_ORDER.indexOf((theme as typeof THEME_ORDER[number]) || 'system')
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length
    setTheme(THEME_ORDER[nextIndex])
  }

  function getThemeLabel(): string {
    if (theme === 'light') return t('light')
    if (theme === 'dark') return t('dark')
    return t('system')
  }

  async function handleExport() {
    const recipes = await db.recipes.toArray()
    const mealPlans = await db.mealPlans.toArray()
    const groceryLists = await db.groceryLists.toArray()

    const data = { recipes, mealPlans, groceryLists, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `recipe-ai-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (data.recipes && Array.isArray(data.recipes)) {
        await db.recipes.bulkPut(data.recipes)
      }
      if (data.mealPlans && Array.isArray(data.mealPlans)) {
        await db.mealPlans.bulkPut(data.mealPlans)
      }
      if (data.groceryLists && Array.isArray(data.groceryLists)) {
        await db.groceryLists.bulkPut(data.groceryLists)
      }

      setFeedback({ type: 'success', message: t('importSuccess') })
    } catch {
      setFeedback({ type: 'error', message: t('importError') })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-24 md:max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
        </Link>
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-primary/10 text-primary'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Appearance section */}
      <div className="overflow-hidden rounded-2xl bg-card">
        <SettingsRow
          icon={<Globe className="h-5 w-5 text-blue-500" />}
          label={t('language')}
          value={locale === 'en' ? 'English' : '\u0627\u0644\u0639\u0631\u0628\u064A\u0629'}
          onTap={toggleLocale}
        />
        <div className="ms-14 border-t border-border/30" />
        <SettingsRow
          icon={<Palette className="h-5 w-5 text-purple-500" />}
          label={t('theme')}
          value={getThemeLabel()}
          onTap={cycleTheme}
        />
      </div>

      {/* Data section */}
      <div className="overflow-hidden rounded-2xl bg-card">
        <SettingsRow
          icon={<Download className="h-5 w-5 text-green-500" />}
          label={t('export')}
          onTap={handleExport}
        />
        <div className="ms-14 border-t border-border/30" />
        <SettingsRow
          icon={<Upload className="h-5 w-5 text-orange-500" />}
          label={t('importData')}
          onTap={() => fileInputRef.current?.click()}
        />
      </div>

      {/* About section */}
      <div className="overflow-hidden rounded-2xl bg-card">
        <SettingsRow
          icon={<Info className="h-5 w-5 text-muted-foreground" />}
          label="Version"
          value="0.1.0"
          disabled
        />
        <div className="ms-14 border-t border-border/30" />
        <div className="px-4 py-3 text-center text-sm text-muted-foreground">
          Made with {'\u{1F49C}'}
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
        id="import-file"
      />
    </div>
  )
}

function SettingsRow({
  icon,
  label,
  value,
  onTap,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  onTap?: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={disabled ? undefined : onTap}
      className={`flex w-full items-center gap-3 px-4 py-3 text-start transition-colors ${
        disabled ? '' : 'active:bg-muted/30'
      }`}
      disabled={disabled}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">{icon}</div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && (
        <span className="text-sm text-muted-foreground">{value}</span>
      )}
      {!disabled && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
    </motion.button>
  )
}
