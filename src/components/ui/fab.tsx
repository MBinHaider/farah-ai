'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface FabProps {
  onClick: () => void
  label?: string
}

export function Fab({ onClick, label }: FabProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      aria-label={label || 'Add'}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 md:hidden"
    >
      <Plus className="h-6 w-6" />
    </motion.button>
  )
}
