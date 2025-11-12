/**
 * Message Templates Domain Logic
 * Pure functions for nudge messages and SMS templates
 * No Convex dependencies
 */

/**
 * Get Day 5 nudge message
 * Pure function
 */
export function getDay5Nudge(name: string): string {
  return `Hey ${name}, just checking in. How are things going?`;
}

/**
 * Get Day 7 nudge message
 * Pure function
 */
export function getDay7Nudge(name: string): string {
  return `Hi ${name}, I haven't heard from you in a while. Everything okay?`;
}

/**
 * Get Day 14 nudge message
 * Pure function
 */
export function getDay14Nudge(name: string): string {
  return `${name}, I'm here if you need support. Reply anytime.`;
}

