import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string | undefined | null): string {
  // Mask phone number: +1-XXX-XXX-1234
  if (!phone) return 'N/A'
  if (phone.length >= 10) {
    const last4 = phone.slice(-4)
    return `+1-XXX-XXX-${last4}`
  }
  return phone
}

export function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function getBurnoutColor(score: number | undefined): string {
  if (score === undefined) return 'gray'
  if (score >= 80) return 'red'      // Crisis
  if (score >= 60) return 'orange'   // High
  if (score >= 40) return 'yellow'   // Moderate
  if (score >= 20) return 'blue'     // Mild
  return 'green'                     // Thriving
}

export function getBurnoutVariant(score: number | undefined): 'default' | 'destructive' | 'outline' | 'secondary' {
  if (score === undefined) return 'outline'

  // Lower scores = more burnout (matches src/burnoutCalculator.ts:147-153)
  if (score < 20) return 'destructive'  // crisis (0-19): red, urgent
  if (score < 40) return 'destructive'  // high (20-39): red, serious
  if (score < 60) return 'secondary'    // moderate (40-59): muted, caution
  if (score < 80) return 'default'      // mild (60-79): normal, stable
  return 'default'                      // thriving (80-100): normal, good
}
