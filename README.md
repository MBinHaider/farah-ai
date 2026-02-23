# Farah AI

AI-powered recipe organizer — import, generate, and plan meals.

## Features

- **Import recipes** from YouTube videos, recipe websites, or pasted text
- **Generate recipes** with AI from a simple description
- **Meal planning** with weekly calendar
- **Grocery list** auto-generated from your meal plan
- **Step-by-step cooking mode** with timers
- **Bilingual** English and Arabic (RTL) support
- **Offline-first** with IndexedDB storage
- **Dark mode** support

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [Google Gemini](https://ai.google.dev) for AI recipe extraction and generation
- [Dexie.js](https://dexie.org) (IndexedDB) for offline-first storage
- [next-intl](https://next-intl.dev) for i18n (English + Arabic)
- [Tailwind CSS](https://tailwindcss.com) + [Radix UI](https://www.radix-ui.com)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key ([get one here](https://aistudio.google.com/apikey)) |

## Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Ffarah-ai&env=GEMINI_API_KEY&envDescription=Google%20Gemini%20API%20key%20for%20AI%20features)

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Add `GEMINI_API_KEY` in Environment Variables
4. Deploy

> **Note:** YouTube video import uses `yt-dlp` which is not available on Vercel serverless functions. Video import will gracefully fall back to a text-based message asking users to paste the recipe text. All other features (URL import, text import, AI generation) work fully on Vercel.

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run test      # Run tests
npm run lint      # Lint code
```

## License

MIT
