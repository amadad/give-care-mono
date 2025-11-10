/**
 * Date Formatting Utilities
 *
 * Standardized date formatting across the admin dashboard
 */

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format timestamp to locale date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "Dec 15, 2024")
 */
export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'MMM d, yyyy');
}

/**
 * Format timestamp to locale date and time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string (e.g., "Dec 15, 2024 3:45 PM")
 */
export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
}

/**
 * Format timestamp to full date and time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string (e.g., "December 15, 2024 at 3:45:30 PM")
 */
export function formatDateTimeFull(timestamp: number): string {
  return format(new Date(timestamp), 'MMMM d, yyyy \'at\' h:mm:ss a');
}

/**
 * Format timestamp to relative time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Format timestamp to ISO string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns ISO string (e.g., "2024-12-15T15:45:30.000Z")
 */
export function formatISO(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
