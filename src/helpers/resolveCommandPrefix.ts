/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { Locale } from "../i18n/locales.js";

export type ResolvedCommandPrefix = {
  matched: boolean;
  prefix: string;
  /** Present only when the match came from prefixByLocale. */
  locale?: Locale;
};

export function isValidPrefixSymbol(prefix: string): boolean {
  return Boolean(prefix) && prefix.length <= 5 && !/\s/.test(prefix);
}

export function getPrefixByLocaleEntries(
  prefixByLocale: Partial<Record<Locale, string>> | undefined,
): Array<[Locale, string]> {
  return Object.entries(prefixByLocale ?? {})
    .filter((entry): entry is [Locale, string] => Boolean(entry[1]))
    .map(([locale, prefix]) => [locale as Locale, prefix]);
}

/** Returns another locale already using this prefix, if any. */
export function findDuplicatePrefixLocale(
  prefixByLocale: Partial<Record<Locale, string>> | undefined,
  locale: Locale,
  prefix: string,
): Locale | undefined {
  for (const [otherLocale, otherPrefix] of getPrefixByLocaleEntries(prefixByLocale)) {
    if (otherLocale !== locale && otherPrefix === prefix) return otherLocale;
  }
  return undefined;
}

/**
 * Resolves which prefix (and optional locale) applies to a message body.
 * Empty map → only fallbackPrefix (legacy / group override).
 * Non-empty map → try mapped prefixes (longest first), then fallback.
 */
export function resolveCommandPrefix(
  body: string,
  prefixByLocale: Partial<Record<Locale, string>> | undefined,
  fallbackPrefix: string,
): ResolvedCommandPrefix {
  const entries = getPrefixByLocaleEntries(prefixByLocale);

  if (entries.length > 0) {
    const sorted = [...entries].sort((a, b) => b[1].length - a[1].length);
    for (const [locale, prefix] of sorted) {
      if (body.startsWith(prefix)) {
        return { matched: true, prefix, locale };
      }
    }
  }

  if (fallbackPrefix && body.startsWith(fallbackPrefix)) {
    return { matched: true, prefix: fallbackPrefix };
  }

  return { matched: false, prefix: fallbackPrefix };
}
