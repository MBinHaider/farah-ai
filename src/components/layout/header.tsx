'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'

export function Header() {
  const t = useTranslations('common')

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <Image
            src="/logo.png"
            alt="Farah Recipes"
            width={36}
            height={54}
            className="h-9 w-auto"
            priority
          />
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
      className={`rounded-md px-2 py-1 text-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  )
}
