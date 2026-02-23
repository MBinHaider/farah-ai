'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'

export function Header() {
  const t = useTranslations('common')

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" className="h-8 w-8" aria-hidden="true">
            <rect width="512" height="512" rx="108" fill="currentColor" />
            <path d="M136 280C136 260 140 240 160 230H352C372 240 376 260 376 280V340C376 380 340 410 300 410H212C172 410 136 380 136 340Z" fill="white" opacity="0.95"/>
            <rect x="120" y="218" width="272" height="24" rx="12" fill="white"/>
            <rect x="88" y="224" width="44" height="12" rx="6" fill="hsl(36 70% 55%)"/>
            <rect x="380" y="224" width="44" height="12" rx="6" fill="hsl(36 70% 55%)"/>
            <path d="M200 190Q190 160 200 130Q210 100 200 70" stroke="white" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.5"/>
            <path d="M256 180Q246 150 256 120Q266 90 256 60" stroke="white" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.4"/>
            <path d="M312 190Q302 160 312 130Q322 100 312 70" stroke="white" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.5"/>
            <text x="216" y="355" fontFamily="Arial,Helvetica,sans-serif" fontWeight="bold" fontSize="130" fill="hsl(142 40% 35%)" opacity="0.9">F</text>
            <rect x="340" y="370" width="68" height="36" rx="18" fill="hsl(36 70% 55%)"/>
            <text x="374" y="396" fontFamily="Arial,Helvetica,sans-serif" fontWeight="bold" fontSize="22" fill="white" textAnchor="middle">AI</text>
          </svg>
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
