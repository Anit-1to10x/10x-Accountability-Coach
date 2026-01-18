'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Bell, X, CheckCircle, AlertTriangle, Zap, Info, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: 'reminder' | 'achievement' | 'motivation' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
  action?: {
    label: string
    href: string
  }
}

/**
 * Smart Notification Bell
 *
 * Polls for notifications every 30 seconds and displays them.
 * Claude Code generates these dynamically based on user's data.
 */
export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Poll for notifications every 30 seconds
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read (in real app, would call API)
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))

    // Navigate if action provided
    if (notification.action?.href) {
      router.push(notification.action.href)
      setIsOpen(false)
    }
  }

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => {
      const dismissed = notifications.find(n => n.id === id)
      return dismissed && !dismissed.read ? Math.max(0, prev - 1) : prev
    })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Sparkles className="w-4 h-4 text-yellow-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-400" />
      case 'motivation': return <Zap className="w-4 h-4 text-purple-400" />
      case 'reminder': return <Bell className="w-4 h-4 text-blue-400" />
      default: return <Info className="w-4 h-4 text-gray-400" />
    }
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500'
      case 'medium': return 'border-l-4 border-l-yellow-500'
      default: return 'border-l-4 border-l-gray-500'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-oa-bg-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-oa-text-secondary" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-oa-bg-secondary border border-oa-border rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-oa-border flex items-center justify-between">
            <h3 className="font-medium text-oa-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-oa-text-secondary">
                {unreadCount} unread
              </span>
            )}
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-8 h-8 text-oa-text-secondary mx-auto mb-2 opacity-50" />
              <p className="text-sm text-oa-text-secondary">No notifications</p>
              <p className="text-xs text-oa-text-secondary/60 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-oa-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    px-4 py-3 cursor-pointer hover:bg-oa-bg-tertiary transition-colors
                    ${!notification.read ? 'bg-oa-accent/5' : ''}
                    ${getPriorityStyles(notification.priority)}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${notification.read ? 'text-oa-text-secondary' : 'text-oa-text-primary'}`}>
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => handleDismiss(notification.id, e)}
                          className="p-1 hover:bg-oa-bg-secondary rounded opacity-50 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-oa-text-secondary mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.action && (
                        <span className="inline-block mt-1 text-xs text-oa-accent hover:underline">
                          {notification.action.label} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
