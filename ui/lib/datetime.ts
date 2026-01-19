/**
 * Date/Time/Timezone Utilities
 *
 * Automatic timezone detection and date formatting for users
 */

// Client-side timezone detection
export function detectTimezone(): string {
  if (typeof window === 'undefined') {
    return 'UTC'
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

// Get current date in user's timezone
export function getCurrentDate(timezone?: string): Date {
  const now = new Date()
  if (!timezone) return now

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }

    const formatted = new Intl.DateTimeFormat('en-US', options).format(now)
    return new Date(formatted)
  } catch {
    return now
  }
}

// Format date for display
export function formatDate(date: Date | string, timezone?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(timezone && { timeZone: timezone }),
  }

  return d.toLocaleDateString('en-US', options)
}

// Format time for display
export function formatTime(date: Date | string, timezone?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(timezone && { timeZone: timezone }),
  }

  return d.toLocaleTimeString('en-US', options)
}

// Format datetime for display
export function formatDateTime(date: Date | string, timezone?: string): string {
  return `${formatDate(date, timezone)} at ${formatTime(date, timezone)}`
}

// Get greeting based on time of day
export function getTimeBasedGreeting(timezone?: string): string {
  const now = timezone ? getCurrentDate(timezone) : new Date()
  const hour = now.getHours()

  if (hour >= 5 && hour < 12) {
    return 'Good morning'
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon'
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening'
  } else {
    return 'Good night'
  }
}

// Get day progress (0-100%)
export function getDayProgress(timezone?: string): number {
  const now = timezone ? getCurrentDate(timezone) : new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()

  // Assuming day starts at 6am and ends at 10pm (16 productive hours)
  const productiveStart = 6
  const productiveEnd = 22
  const totalProductiveHours = productiveEnd - productiveStart

  if (hours < productiveStart) return 0
  if (hours >= productiveEnd) return 100

  const elapsedHours = hours - productiveStart + minutes / 60
  return Math.round((elapsedHours / totalProductiveHours) * 100)
}

// Check if it's a new day (for streak purposes)
export function isNewDay(lastDate: string | Date, timezone?: string): boolean {
  const last = typeof lastDate === 'string' ? new Date(lastDate) : lastDate
  const now = timezone ? getCurrentDate(timezone) : new Date()

  const lastDay = last.toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  return lastDay !== today
}

// Get today's date string (YYYY-MM-DD)
export function getTodayString(timezone?: string): string {
  const now = timezone ? getCurrentDate(timezone) : new Date()
  return now.toISOString().split('T')[0]
}

// Calculate days between two dates
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2

  const diff = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Get relative time string (e.g., "2 hours ago", "yesterday")
export function getRelativeTime(date: Date | string, timezone?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = timezone ? getCurrentDate(timezone) : new Date()

  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`

  return formatDate(d, timezone)
}

// Timezone-aware context for AI
export function getDateTimeContext(timezone?: string): {
  date: string
  time: string
  dayOfWeek: string
  greeting: string
  dayProgress: number
  timezone: string
} {
  const tz = timezone || detectTimezone()
  const now = getCurrentDate(tz)

  return {
    date: formatDate(now, tz),
    time: formatTime(now, tz),
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: tz }),
    greeting: getTimeBasedGreeting(tz),
    dayProgress: getDayProgress(tz),
    timezone: tz,
  }
}
