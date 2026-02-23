import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Inter, Cairo } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export const metadata: Metadata = {
  title: 'Farah AI',
  description: 'AI-powered recipe organizer — import, generate, and plan meals',
  metadataBase: new URL('https://farah-ai-two.vercel.app'),
  openGraph: {
    title: 'Farah AI',
    description: 'AI-powered recipe organizer — import, generate, and plan meals',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farah AI',
    description: 'AI-powered recipe organizer — import, generate, and plan meals',
  },
  icons: {
    icon: '/logo.png',
    apple: '/apple-icon.png',
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'en' | 'ar')) {
    notFound()
  }
  const messages = await getMessages()
  const isRtl = locale === 'ar'

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cairo.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <Header />
            <main className="container mx-auto px-4 pb-20 pt-4 md:pb-4">
              {children}
            </main>
            <BottomNav />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
