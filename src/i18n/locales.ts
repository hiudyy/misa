/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
export const LOCALE_METADATA = {
  pt: {
    code: "pt",
    displayName: "Portuguese",
    nativeName: "Português",
    displayLabel: "Português (pt)",
    globalAliases: ["idioma", "setidioma"],
    groupAliases: ["idiomagp", "idiomagrupo"],
  },
  es: {
    code: "es",
    displayName: "Spanish",
    nativeName: "Español",
    displayLabel: "Español (es)",
    globalAliases: ["lenguaje", "setlenguaje"],
    groupAliases: ["idiomgp", "lenguajegrupo"],
  },
  en: {
    code: "en",
    displayName: "English",
    nativeName: "English",
    displayLabel: "English (en)",
    globalAliases: ["language", "setlanguage", "lang", "setlang"],
    groupAliases: ["langgroup", "languagegroup", "setlanggroup"],
  },
  id: {
    code: "id",
    displayName: "Indonesian",
    nativeName: "Bahasa Indonesia",
    displayLabel: "Bahasa Indonesia (id)",
    globalAliases: ["bahasa", "setbahasa"],
    groupAliases: ["bahasagrup", "setbahasagrup"],
  },
  ar: {
    code: "ar",
    displayName: "Arabic",
    nativeName: "العربية",
    displayLabel: "العربية (ar)",
    globalAliases: ["lugha", "setlugha", "lughah", "setlughah"],
    groupAliases: ["lughatgroup", "setlughatgroup", "lughahgroup", "setlughahgroup"],
  },
  fr: {
    code: "fr",
    displayName: "French",
    nativeName: "Français",
    displayLabel: "Français (fr)",
    globalAliases: ["langue", "setlangue"],
    groupAliases: ["languegroupe", "setlanguegroupe"],
  },
  hi: {
    code: "hi",
    displayName: "Hindi",
    nativeName: "हिन्दी",
    displayLabel: "हिन्दी (hi)",
    globalAliases: ["bhasha", "setbhasha"],
    groupAliases: ["bhashagroup", "setbhashagroup"],
  },
  ur: {
    code: "ur",
    displayName: "Urdu",
    nativeName: "اردو",
    displayLabel: "اردو (ur)",
    globalAliases: ["zaban", "setzaban"],
    groupAliases: ["zabangroup", "setzabangroup"],
  },
  de: {
    code: "de",
    displayName: "German",
    nativeName: "Deutsch",
    displayLabel: "Deutsch (de)",
    globalAliases: ["sprache", "setsprache"],
    groupAliases: ["gruppensprache", "setgruppensprache"],
  },
  tr: {
    code: "tr",
    displayName: "Turkish",
    nativeName: "Türkçe",
    displayLabel: "Türkçe (tr)",
    globalAliases: ["dil", "setdil"],
    groupAliases: ["grupdili", "setgrupdili"],
  },
  bn: {
    code: "bn",
    displayName: "Bengali",
    nativeName: "বাংলা",
    displayLabel: "বাংলা (bn)",
    globalAliases: ["bhasha", "setbhasha", "bangla", "setbangla"],
    groupAliases: ["groupbhasha", "setgroupbhasha", "grupbangla", "setgrupbangla"],
  },
} as const;

export type Locale = keyof typeof LOCALE_METADATA;

export const SUPPORTED_LOCALES = Object.keys(LOCALE_METADATA) as Locale[];

export const DEFAULT_LOCALE: Locale = "pt";

export function isValidLocale(value: string): value is Locale {
  return value in LOCALE_METADATA;
}

export function getLocaleMetadata(locale: Locale) {
  return LOCALE_METADATA[locale];
}

export function getLocaleLabel(locale: Locale): string {
  return LOCALE_METADATA[locale].displayLabel;
}

export function getLocaleCodes(separator = ", "): string {
  return SUPPORTED_LOCALES.join(separator);
}

export function getLocaleCommandOptions(): string {
  return SUPPORTED_LOCALES.join("|");
}

export function getLocaleDisplayList(separator = ", "): string {
  return SUPPORTED_LOCALES.map((locale) => getLocaleLabel(locale)).join(separator);
}

export function getGlobalLanguageAliases(): Partial<Record<Locale, string[]>> {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, LOCALE_METADATA[locale].globalAliases]),
  ) as Partial<Record<Locale, string[]>>;
}

export function getGroupLanguageAliases(): Partial<Record<Locale, string[]>> {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, LOCALE_METADATA[locale].groupAliases]),
  ) as Partial<Record<Locale, string[]>>;
}
