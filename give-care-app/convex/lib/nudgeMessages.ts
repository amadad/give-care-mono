/**
 * Proactive Messaging - Nudge Messages
 * 
 * Graduated response messages for re-engaging inactive users.
 * Escalates concern and includes crisis resources at Day 7+.
 */

export function getDay5Nudge(name: string): string {
  return `Hi ${name}, we haven't heard from you in a bit—hope you and your care recipient are okay. No pressure to reply, just want you to know I'm here.`;
}

export function getDay7Nudge(name: string): string {
  return `Hi ${name}, I'm a bit worried—you've been quiet for a week, which isn't like you. If you're feeling overwhelmed or need help, please reach out. You can always call 988 or text 741741 if you're in crisis. Thinking of you.`;
}

export function getDay14Nudge(name: string): string {
  return `Hi ${name}, it's been two weeks since we last connected. I'm here whenever you need support. If you're in crisis, call 988 or text 741741. Take care.`;
}

export function getCrisisResources(): string {
  return `988 Suicide & Crisis Lifeline (24/7): Call or text 988\n741741 Crisis Text Line: Text HOME\n911 if you're in immediate danger`;
}

