'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { Home, Sparkles, Calendar, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/' as const, icon: Home, labelKey: 'home' as const },
  { href: '/generate' as const, icon: Sparkles, labelKey: 'generate' as const },
  { href: '/plan' as const, icon: Calendar, labelKey: 'plan' as const },
  { href: '/settings' as const, icon: Settings, labelKey: 'settings' as const },
]

export function BottomNav() {
  const t = useTranslations('common')
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href} className="relative flex flex-col items-center gap-0.5 px-4 py-1.5">
              <motion.div
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="flex flex-col items-center gap-0.5"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`relative z-10 h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`relative z-10 text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {t(labelKey)}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
