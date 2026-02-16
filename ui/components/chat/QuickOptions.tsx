'use client'

import { motion } from 'framer-motion'

interface Option {
  label: string
  value: string
}

interface QuickOptionsProps {
  options: Option[]
  onSelect: (value: string) => void
}

export default function QuickOptions({ options, onSelect }: QuickOptionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mb-4"
    >
      {options.map((option, index) => (
        <motion.button
          key={option.value}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(option.value)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
        >
          {option.label}
        </motion.button>
      ))}
    </motion.div>
  )
}
