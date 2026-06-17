import { isValidIsoDate, isValidTime } from './examValidation'

export function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isValidIsoDate(isoDate)) {
    return 'Date not set'
  }

  const date = new Date(`${isoDate}T12:00:00`)
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return 'Date not set'
  }
}

export function formatTime(time: string | null | undefined): string {
  if (!isValidTime(time)) {
    return 'Time not set'
  }

  const [hours, minutes] = (time as string).split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  } catch {
    return 'Time not set'
  }
}

export function rankLabel(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}
