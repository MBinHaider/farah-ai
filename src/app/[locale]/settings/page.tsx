'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter, usePathname } from '@/i18n/routing'
import { useTheme } from 'next-themes'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle2, AlertCircle, Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

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
    <div className="space-y-6">
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-2 -ms-2">
            <ArrowLeft className="me-1 h-4 w-4" />
            {t('title')}
          </Button>
        </Link>
        <h1 className="text-xl font-bold sm:text-2xl">{t('title')}</h1>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
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

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('language')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('theme')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
            >
              {t('light')}
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              {t('dark')}
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
            >
              {t('system')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('export')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('export')}
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('importData')}</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {t('importData')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
