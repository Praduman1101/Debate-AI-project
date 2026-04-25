/**
 * Format a duration in seconds into a human-readable string
 * e.g. 125 → "2m 5s"  |  45 → "45s"  |  3661 → "1h 1m"
 */
export const formatDuration = (seconds = 0) => {
  if (!seconds || seconds < 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

/**
 * Format a date string or Date object into a localized display string
 * e.g. "Apr 19, 2026"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Format a date as relative time
 * e.g. "2 hours ago" | "3 days ago" | "just now"
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const now  = Date.now();
  const then = new Date(dateInput).getTime();
  const diff = Math.floor((now - then) / 1000); // seconds

  if (diff < 60)           return 'just now';
  if (diff < 3600)         return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)        return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7)    return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateInput);
};

/**
 * Truncate text to a maximum length, appending ellipsis if needed
 */
export const truncate = (text = '', maxLen = 80) =>
  text.length <= maxLen ? text : text.slice(0, maxLen - 3) + '…';

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str = '') =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

/**
 * Get a letter-grade from a numeric score (0-100)
 */
export const scoreToGrade = (score) => {
  if (score >= 90) return { grade: 'A+', color: '#1D9E75' };
  if (score >= 80) return { grade: 'A',  color: '#1D9E75' };
  if (score >= 70) return { grade: 'B',  color: '#378ADD' };
  if (score >= 60) return { grade: 'C',  color: '#EF9F27' };
  if (score >= 50) return { grade: 'D',  color: '#E24B4A' };
  return               { grade: 'F',  color: '#E24B4A' };
};

/**
 * Determine win/loss/draw label and color for a debate result
 */
export const getResultConfig = (winner) => {
  switch (winner) {
    case 'user':     return { icon: '🏆', label: 'Won',  color: '#1D9E75' };
    case 'opponent': return { icon: '📚', label: 'Lost', color: '#E24B4A' };
    case 'draw':     return { icon: '🤝', label: 'Draw', color: '#EF9F27' };
    default:         return { icon: '❓', label: '—',    color: '#7a9ab8' };
  }
};

/**
 * Clamp a number between min and max
 */
export const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

/**
 * Debounce a function call
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Generate initials from a name (up to 2 chars)
 * e.g. "John Doe" → "JD"  |  "Alice" → "A"
 */
export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

/**
 * Calculate win rate percentage
 */
export const calcWinRate = (wins = 0, total = 0) =>
  total > 0 ? Math.round((wins / total) * 100) : 0;

/**
 * Format a score delta with + / - sign
 * e.g. 5 → "+5"  |  -3 → "-3"
 */
export const formatDelta = (delta = 0) =>
  delta >= 0 ? `+${delta}` : `${delta}`;
