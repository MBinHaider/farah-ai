'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useGroceryList } from '@/hooks/use-grocery-list'
import { toFraction } from '@/lib/utils/servings'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Share2, ShoppingCart } from 'lucide-react'
import { Link } from '@/i18n/routing'

const CATEGORY_EMOJI: Record<string, string> = {
  produce: '\u{1F955}',
  protein: '\u{1F969}',
  dairy: '\u{1F9C8}',
  grain: '\u{1F35E}',
  spice: '\u{1F9C2}',
  oil: '\u{1FAD2}',
  sweetener: '\u{1F36F}',
  other: '\u{1F4E6}',
}

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] || CATEGORY_EMOJI.other
}

export default function GroceryListPage() {
  const locale = useLocale()
  const t = useTranslations('grocery')
  const { items, toggleItem } = useGroceryList()

  // Group items by category
  const grouped = items.reduce<Record<string, { item: typeof items[0]; index: number }[]>>(
    (acc, item, index) => {
      const cat = item.category || 'other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push({ item, index })
      return acc
    },
    {}
  )

  const categories = Object.keys(grouped).sort()
  const allChecked = items.length > 0 && items.every((item) => item.checked)
  const checkedCount = items.filter((item) => item.checked).length
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0

  async function handleShare() {
    const lines = items.map((item) => {
      const name = locale === 'ar' && item.nameAr ? item.nameAr : item.name
      const check = item.checked ? '\u2611' : '\u2610'
      return `${check} ${toFraction(item.quantity)} ${item.unit} ${name}`
    })
    const text = `${t('title')}\n\n${lines.join('\n')}`

    if (navigator.share) {
      try {
        await navigator.share({ title: t('title'), text })
      } catch {
        // User cancelled or share failed — fall back to clipboard
        await navigator.clipboard.writeText(text)
      }
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-28 md:max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/plan">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
          </Link>
          <h1 className="text-xl font-bold">{t('title')}</h1>
        </div>
        {items.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted/50"
            aria-label={t('share')}
          >
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('empty')}</p>
        </div>
      )}

      {/* All checked celebration */}
      {allChecked && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-10 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-primary">{t('allChecked')}</p>
        </motion.div>
      )}

      {/* Category sections */}
      {items.length > 0 && (
        <div className="space-y-5">
          {categories.map((category, catIndex) => (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.04 }}
            >
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold capitalize text-muted-foreground">
                <span>{getCategoryEmoji(category)}</span>
                {category}
              </h2>
              <div className="divide-y divide-border/40">
                {grouped[category].map(({ item, index }) => {
                  const name = locale === 'ar' && item.nameAr ? item.nameAr : item.name
                  return (
                    <motion.button
                      key={index}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleItem(index)}
                      className={`flex w-full items-center gap-3 px-1 py-3 text-start transition-colors ${
                        item.checked ? 'opacity-40' : ''
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                          item.checked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {item.checked && <Check className="h-3 w-3" />}
                      </div>
                      <span
                        className={`flex-1 text-sm ${
                          item.checked ? 'line-through' : 'font-medium'
                        }`}
                      >
                        {name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {toFraction(item.quantity)} {item.unit}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.section>
          ))}
        </div>
      )}

      {/* Sticky progress bar at bottom */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border/30 bg-background/90 px-4 py-3 backdrop-blur-sm md:bottom-0">
          <div className="mx-auto max-w-lg md:max-w-2xl">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('progress', { checked: checkedCount, total: items.length })}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
