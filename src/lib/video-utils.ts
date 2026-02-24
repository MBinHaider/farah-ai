const YOUTUBE_PATTERNS = [
  /youtube\.com\/shorts\//,
  /youtube\.com\/watch/,
  /youtu\.be\//,
]

const TIKTOK_PATTERNS = [
  /tiktok\.com\//,
]

const INSTAGRAM_PATTERNS = [
  /instagram\.com\/(p|reel|reels)\//,
]

export function isVideoUrl(url: string): boolean {
  return [...YOUTUBE_PATTERNS, ...TIKTOK_PATTERNS, ...INSTAGRAM_PATTERNS].some((p) => p.test(url))
}
