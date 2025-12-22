import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceStrict } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseUTC(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();

  // Normalize format (replace space with T)
  let normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');

  // Ensure it has a Z suffix for UTC
  if (!normalized.endsWith('Z') && !normalized.includes('+')) {
    normalized += 'Z';
  }

  const date = new Date(normalized);
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Formats seconds into a descriptive string including seconds.
 * Example: 909 seconds -> "15 min 9 sec"
 */
export function formatUptime(seconds: number) {
  if (!seconds || seconds <= 0) return '0 sec';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (secs > 0 || (parts.length === 0)) parts.push(`${secs} sec`);

  if (parts.length > 1) {
    const last = parts.pop();
    return parts.join(' ') + ' and ' + last;
  }
  return parts[0];
}

/**
 * Calculates relative time between two dates and returns a string like "15 min 9 sec"
 * if the difference is small, or standard relative time if long.
 */
export function formatDetailedDuration(startTimeStr: string | null | undefined, serverTimeStr?: string | null) {
  if (!startTimeStr) return '—';

  const start = parseUTC(startTimeStr).getTime();
  const now = serverTimeStr ? parseUTC(serverTimeStr).getTime() : Date.now();

  const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
  return formatUptime(diffSeconds);
}

export function formatRelativeTime(dateStr: string | null | undefined, serverTimeStr?: string | null) {
  if (!dateStr) return 'Never';

  const targetDate = parseUTC(dateStr);
  const referenceDate = serverTimeStr ? parseUTC(serverTimeStr) : new Date();

  try {
    // Use formatDistanceStrict for standard relative strings (e.g. "5 minutes ago")
    return formatDistanceStrict(targetDate, referenceDate, { addSuffix: true });
  } catch (e) {
    return 'Just now';
  }
}
