import { RRule } from 'rrule'
import { logSafe } from '../utils/logger'

export function calculateNextOccurrence(
  rruleString: string,
  timezone: string,
  after: number = Date.now()
): number {
  try {
    const rrule = RRule.fromString(rruleString)
    const nextDateUTC = rrule.after(new Date(after), false)
    if (!nextDateUTC) {
      return Date.now() + 365 * 24 * 60 * 60 * 1000
    }
    const year = nextDateUTC.getUTCFullYear()
    const month = nextDateUTC.getUTCMonth() + 1
    const day = nextDateUTC.getUTCDate()
    const hour = nextDateUTC.getUTCHours()
    const minute = nextDateUTC.getUTCMinutes()
    const localTimeString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
    return convertLocalToUTC(localTimeString, timezone)
  } catch (error) {
    logSafe('Triggers', 'Error parsing RRULE', { rruleString, error: String(error) })
    throw error
  }
}

export function convertLocalToUTC(localTimeString: string, timezone: string): number {
  const date = new Date(localTimeString + 'Z')
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const tzTime: Record<string, number> = {}
  for (const part of parts) if (part.type !== 'literal') tzTime[part.type] = parseInt(part.value, 10)
  const tzDate = new Date(
    tzTime.year,
    (tzTime.month ?? 1) - 1,
    tzTime.day ?? 1,
    tzTime.hour ?? 0,
    tzTime.minute ?? 0,
    tzTime.second ?? 0
  )
  return tzDate.getTime()
}

