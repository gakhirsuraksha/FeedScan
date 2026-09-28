/** Generate a short, human-readable session ID with FeedScan prefix */
export function generateSessionId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FS-${ts}-${rnd}`;
}

/** Format a Unix timestamp as a readable local date-time string */
export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
