'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const t = useTranslations('recipe')
  const locale = useLocale()
  const title = locale === 'ar' && recipe.titleAr ? recipe.titleAr : recipe.title

  return (
    <Link href={`/recipes/${recipe.id}` as never}>
      <Card className="h-full transition-shadow hover:shadow-md">
        {recipe.image && (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img src={recipe.image} alt={title} className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-2 text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.prepTime + recipe.cookTime}m
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {recipe.servings}
            </span>
          </div>
          {recipe.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
