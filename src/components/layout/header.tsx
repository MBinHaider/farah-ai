'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'

export function Header() {
  const t = useTranslations('common')

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          {t('appName')}
        </Link>
        <nav className="hidden md:flex items-center gap-4">
          <NavLink href="/">{t('home')}</NavLink>
          <NavLink href="/import">{t('import')}</NavLink>
          <NavLink href="/generate">{t('generate')}</NavLink>
          <NavLink href="/plan">{t('plan')}</NavLink>
          <NavLink href="/grocery">{t('grocery')}</NavLink>
          <NavLink href="/settings">{t('settings')}</NavLink>
        </nav>
      </div>
    </header>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = pathname === href
  return (
    <Link
      href={href}
      className={`text-sm transition-colors hover:text-primary ${
        isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  )
}
