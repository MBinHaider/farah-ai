'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ChefHat, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Recipe } from '@/types/recipe'

interface RecipeCardProps {
  recipe: Recipe
  variant?: 'compact' | 'full'
}

export function RecipeCard({ recipe, variant = 'compact' }: RecipeCardProps) {
  const locale = useLocale()
  const title = locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title
  const totalTime = recipe.prepTime + recipe.cookTime

  return (
    <Link href={`/recipes/${recipe.id}` as never}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md ${
          variant === 'compact' ? 'w-40 shrink-0' : 'w-full'
        }`}
      >
        {recipe.image ? (
          <div className={`overflow-hidden ${variant === 'compact' ? 'aspect-[3/4]' : 'aspect-video'}`}>
            <img
              src={recipe.image}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className={`flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 ${
            variant === 'compact' ? 'aspect-[3/4]' : 'aspect-video'
          }`}>
            <ChefHat className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="p-3">
          <h3 className={`font-semibold leading-tight ${variant === 'compact' ? 'line-clamp-2 text-sm' : 'line-clamp-2 text-base'}`}>
            {title}
          </h3>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{totalTime}m</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
