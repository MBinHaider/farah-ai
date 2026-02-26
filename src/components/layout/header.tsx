'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'

export function Header() {
  const t = useTranslations('common')
  const pathname = usePathname()
  const isHome = pathname === '/'

  if (!isHome) return null

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4 md:max-w-6xl md:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <Image
            src="/logo.png"
            alt="Farah AI"
            width={28}
            height={42}
            className="h-7 w-auto"
            priority
          />
          {t('appName')}
        </Link>
      </div>
    </header>
  )
}
