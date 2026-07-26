/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
type FailureEntry = { failure: number };
type DurationEntry = { count: number; totalMs: number };

export function formatMetricBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatMetricDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0 ms";
  return ms < 1_000 ? `${Math.round(ms)} ms` : `${(ms / 1_000).toFixed(1)} s`;
}

export function averageDuration(entries: Record<string, DurationEntry>): number {
  const values = Object.values(entries);
  const count = values.reduce((sum, entry) => sum + entry.count, 0);
  if (count === 0) return 0;
  return values.reduce((sum, entry) => sum + entry.totalMs, 0) / count;
}

export function cacheHitRate(caches: Record<string, { hits: number; misses: number }>): string {
  const values = Object.values(caches);
  const hits = values.reduce((sum, entry) => sum + entry.hits, 0);
  const total = values.reduce((sum, entry) => sum + entry.hits + entry.misses, 0);
  return total === 0 ? "0%" : `${((hits / total) * 100).toFixed(1)}%`;
}

export function topFailures(entries: Record<string, FailureEntry>, limit = 5): string {
  const ranked = Object.entries(entries)
    .filter(([, entry]) => entry.failure > 0)
    .sort((a, b) => b[1].failure - a[1].failure || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, entry]) => `${name}:${entry.failure}`);
  return ranked.length > 0 ? ranked.join(", ") : "-";
}
