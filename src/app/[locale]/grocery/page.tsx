'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useGroceryList } from '@/hooks/use-grocery-list'
import { toFraction } from '@/lib/utils/servings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Check } from 'lucide-react'

export default function GroceryListPage() {
  const locale = useLocale()
  const t = useTranslations('grocery')
  const { items, toggleItem } = useGroceryList()

  // Group items by category
  const grouped = items.reduce<Record<string, { item: typeof items[0]; index: number }[]>>(
    (acc, item, index) => {
      const cat = item.category || 'Other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push({ item, index })
      return acc
    },
    {}
  )

  const categories = Object.keys(grouped).sort()
  const allChecked = items.length > 0 && items.every((item) => item.checked)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('empty')}</p>
        </div>
      )}

      {allChecked && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-primary">{t('allChecked')}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {grouped[category].map(({ item, index }) => {
                    const name = locale === 'ar' && item.nameAr ? item.nameAr : item.name
                    return (
                      <li key={index}>
                        <button
                          onClick={() => toggleItem(index)}
                          className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-muted/50 ${
                            item.checked ? 'opacity-50' : ''
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
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
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
