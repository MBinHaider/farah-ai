import createNextIntlPlugin from 'next-intl/plugin'
import withSerwistInit from '@serwist/next'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
})

const nextConfig: NextConfig = {}

export default withSerwist(withNextIntl(nextConfig))
