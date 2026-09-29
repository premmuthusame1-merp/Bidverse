/** Formatting helpers for money, timers and dates. */

export function money(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function shortMoney(value?: number | null): string {
  if (!value) return "—";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
}

/** Countdown string, e.g. "02:45:18" or "18:42:06" for long windows. */
export function countdown(msRemaining: number): string {
  if (msRemaining <= 0) return "00:00:00";
  const totalSeconds = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Compact countdown used in compact rows, e.g. "2d 4h", "4h 12m", "8m 30s". */
export function compactCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "Closed";
  const minutes = Math.floor(msRemaining / 60000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${Math.max(1, Math.round(msRemaining / 1000))}s`;
}

export function relativeTime(timestamp: number, now = Date.now()): string {
  const diff = now - timestamp;
  if (diff < 60000) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function clockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateOnly(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const DAY_MS = 24 * 60 * 60 * 1000;
