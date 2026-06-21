/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
const DURATION_RE = /^(\d+)([mhd])$/i;

export function isDurationToken(value: string | undefined): boolean {
  if (!value) return false;
  return DURATION_RE.test(value.trim());
}

export function parseDurationMs(value: string): number | null {
  const match = DURATION_RE.exec(value.trim());
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (!Number.isFinite(amount) || amount <= 0) return null;

  switch (unit) {
    case "m":
      return amount * 60_000;
    case "h":
      return amount * 3_600_000;
    case "d":
      return amount * 86_400_000;
    default:
      return null;
  }
}

export function formatExpiresAt(expiresAt: string | null | undefined, fallback: string, locale = "pt-BR"): string {
  if (!expiresAt) return fallback;

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}
