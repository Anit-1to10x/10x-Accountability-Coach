'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Icons from 'lucide-react'
import { useNavigationStore } from '@/lib/store'

interface NavSectionProps {
  title: string
  href: string
  icon: string
  count?: number
}

export function NavSection({ title, href, icon, count }: NavSectionProps) {
  const pathname = usePathname()
  const { activeType, activeId, setActive } = useNavigationStore()

  const handleClick = () => {
    setActive('nav', href)
  }

  const isActive = activeType === 'nav' && activeId === href

  // Map icon names to Lucide icons
  const iconMap: Record<string, React.ComponentType<any>> = {
    'calendar': Icons.Calendar,
    'check-square': Icons.CheckSquare,
    'sparkles': Icons.Sparkles,
    'zap': Icons.Zap,
    'flame': Icons.Flame,
    'message-circle': Icons.MessageCircle,
    'file-text': Icons.FileText,
    'message-square': Icons.MessageSquare,
    'image': Icons.Image,
    'help-circle': Icons.HelpCircle,
    'settings': Icons.Settings,
    'target': Icons.Target,
    'trophy': Icons.Trophy,
    'folder': Icons.Folder,
  }

  const IconComponent = iconMap[icon] || Icons.Circle

  return (
    <Link href={href} className="block w-full" onClick={handleClick}>
      <div
        className={`
          mx-3 px-4 py-3 rounded-lg text-base font-medium
          transition-[background-color,transform] duration-150 ease-out
          cursor-pointer no-underline
          ${
            isActive
              ? 'bg-oa-accent text-white shadow-lg'
              : 'text-oa-text-primary hover:bg-oa-bg-secondary hover:translate-x-1'
          }
          active:scale-95
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-oa-text-secondary'}`} />
            <span>{title}</span>
          </div>
          {count !== undefined && count > 0 && (
            <span
              className={`
                px-2 py-0.5 text-xs rounded-full font-medium
                transition-colors duration-150
                ${isActive ? 'bg-white/20 text-white' : 'bg-oa-accent/10 text-oa-accent'}
              `}
            >
              {count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
