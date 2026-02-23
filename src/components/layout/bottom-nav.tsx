'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { Home, Settings, Sparkles, Calendar, ShoppingCart } from 'lucide-react'

const navItems = [
  { href: '/' as const, icon: Home, labelKey: 'home' as const },
  {
    href: '/generate' as const,
    icon: Sparkles,
    labelKey: 'generate' as const,
  },
  { href: '/plan' as const, icon: Calendar, labelKey: 'plan' as const },
  {
    href: '/grocery' as const,
    icon: ShoppingCart,
    labelKey: 'grocery' as const,
  },
  { href: '/settings' as const, icon: Settings, labelKey: 'settings' as const },
]

export function BottomNav() {
  const t = useTranslations('common')
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
