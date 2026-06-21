/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { Locale } from "../i18n/index.js";

type TokenGroup =
  | "punishment"
  | "delete"
  | "ban"
  | "text"
  | "mode"
  | "mention"
  | "on"
  | "off"
  | "reset"
  | "open"
  | "close";

type PlaceholderGroup =
  | "user"
  | "name"
  | "group"
  | "type"
  | "command"
  | "similar"
  | "similarity"
  | "prefix"
  | "bot"
  | "total"
  | "desc";

const TOKEN_ALIASES: Record<Locale, Record<TokenGroup, string[]>> = {
  pt: {
    punishment: ["punicao"],
    delete: ["apagar"],
    ban: ["banir"],
    text: ["texto"],
    mode: ["modo"],
    mention: ["mencao"],
    on: ["on", "ligar", "ativar"],
    off: ["off", "desligar", "desativar"],
    reset: ["reset"],
    open: ["abrir", "a"],
    close: ["fechar", "f"],
  },
  en: {
    punishment: ["punishment"],
    delete: ["delete"],
    ban: ["ban"],
    text: ["text"],
    mode: ["mode"],
    mention: ["mention"],
    on: ["on", "enable", "activate"],
    off: ["off", "disable", "deactivate"],
    reset: ["reset"],
    open: ["open"],
    close: ["close"],
  },
  es: {
    punishment: ["castigo"],
    delete: ["eliminar"],
    ban: ["banir", "expulsar"],
    text: ["texto"],
    mode: ["modo"],
    mention: ["mencion"],
    on: ["encender", "activar"],
    off: ["apagar", "desactivar"],
    reset: ["reiniciar", "restablecer"],
    open: ["abrir"],
    close: ["cerrar"],
  },
  id: {
    punishment: ["hukuman"],
    delete: ["hapus"],
    ban: ["ban", "keluarkan"],
    text: ["teks"],
    mode: ["mode", "modus"],
    mention: ["sebut"],
    on: ["nyalakan", "aktifkan"],
    off: ["matikan", "nonaktifkan"],
    reset: ["reset", "aturulang"],
    open: ["buka"],
    close: ["tutup"],
  },
  ar: {
    punishment: ["uqubah", "عقاب"],
    delete: ["hazf", "حذف"],
    ban: ["hazr", "حظر"],
    text: ["nass", "نص"],
    mode: ["wada", "وضع"],
    mention: ["ishara", "إشارة"],
    on: ["taf3il", "تفعيل"],
    off: ["ta3til", "تعطيل"],
    reset: ["i3adatdabt", "إعادةضبط"],
    open: ["fath", "فتح"],
    close: ["ighlaq", "إغلاق"],
  },
  fr: {
    punishment: ["sanction"],
    delete: ["supprimer"],
    ban: ["bannir"],
    text: ["texte"],
    mode: ["mode"],
    mention: ["mention"],
    on: ["activer"],
    off: ["desactiver", "desactiver"],
    reset: ["reinitialiser"],
    open: ["ouvrir"],
    close: ["fermer"],
  },
  hi: {
    punishment: ["sazaa"],
    delete: ["mitao"],
    ban: ["pratibandh"],
    text: ["text", "paath"],
    mode: ["mode"],
    mention: ["ullekh"],
    on: ["chalu", "sakriya"],
    off: ["band", "nishkriya"],
    reset: ["reset", "dobaraset"],
    open: ["khol"],
    close: ["bandkaro"],
  },
  ur: {
    punishment: ["sazaa"],
    delete: ["mitao"],
    ban: ["pabandi"],
    text: ["matn"],
    mode: ["mode"],
    mention: ["zikr"],
    on: ["chalu", "faal"],
    off: ["band", "ghairfaal"],
    reset: ["reset", "dobaraset"],
    open: ["khol"],
    close: ["bandkaro"],
  },
  de: {
    punishment: ["strafe"],
    delete: ["loeschen"],
    ban: ["sperren"],
    text: ["text"],
    mode: ["modus"],
    mention: ["erwaehnung"],
    on: ["an", "aktivieren"],
    off: ["aus", "deaktivieren"],
    reset: ["zuruecksetzen"],
    open: ["oeffnen"],
    close: ["schliessen"],
  },
  tr: {
    punishment: ["ceza"],
    delete: ["sil"],
    ban: ["yasakla"],
    text: ["metin"],
    mode: ["mod"],
    mention: ["etiket"],
    on: ["acik", "etkinlestir"],
    off: ["kapali", "devredisibirak"],
    reset: ["sifirla"],
    open: ["ac"],
    close: ["kapat"],
  },
  bn: {
    punishment: ["শাস্তি"],
    delete: ["মুছুন"],
    ban: ["ব্যান"],
    text: ["বার্তা"],
    mode: ["মোড"],
    mention: ["মেনশন"],
    on: ["চালু"],
    off: ["বন্ধ"],
    reset: ["রিসেট"],
    open: ["খুলুন"],
    close: ["বন্ধকরুন"],
  },
};

const PLACEHOLDER_ALIASES: Record<Locale, Record<PlaceholderGroup, string[]>> = {
  pt: {
    user: ["@usuario"],
    name: ["@nome"],
    group: ["@grupo"],
    type: ["@tipo"],
    command: ["@comando"],
    similar: ["@parecido"],
    similarity: ["@similaridade"],
    prefix: ["@prefixo"],
    bot: ["@bot"],
    total: ["@total"],
    desc: ["@desc"],
  },
  en: {
    user: ["@user"],
    name: ["@name"],
    group: ["@group"],
    type: ["@type"],
    command: ["@command"],
    similar: ["@similar"],
    similarity: ["@similarity"],
    prefix: ["@prefix"],
    bot: ["@bot"],
    total: ["@total"],
    desc: ["@desc"],
  },
  es: {
    user: ["@usuario"],
    name: ["@nombre"],
    group: ["@grupo"],
    type: ["@tipo"],
    command: ["@comando"],
    similar: ["@parecido"],
    similarity: ["@similitud"],
    prefix: ["@prefijo"],
    bot: ["@bot"],
    total: ["@total"],
    desc: ["@desc"],
  },
  id: {
    user: ["@pengguna"],
    name: ["@nama"],
    group: ["@grup"],
    type: ["@jenis"],
    command: ["@perintah"],
    similar: ["@mirip"],
    similarity: ["@kemiripan"],
    prefix: ["@prefiks"],
    bot: ["@bot"],
    total: ["@total"],
    desc: ["@deskripsi"],
  },
  ar: {
    user: ["@مستخدم"],
    name: ["@اسم"],
    group: ["@مجموعة"],
    type: ["@نوع"],
    command: ["@أمر"],
    similar: ["@مشابه"],
    similarity: ["@تشابه"],
    prefix: ["@بادئة"],
    bot: ["@بوت"],
    total: ["@إجمالي"],
    desc: ["@وصف"],
  },
  fr: {
    user: ["@utilisateur"],
    name: ["@nom"],
    group: ["@groupe"],
    type: ["@type"],
    command: ["@commande"],
    similar: ["@similaire"],
    similarity: ["@similarite"],
    prefix: ["@prefixe"],
    bot: ["@bot"],
    total: ["@total"],
    desc: ["@description"],
  },
  hi: {
    user: ["@उपयोगकर्ता"],
    name: ["@नाम"],
    group: ["@समूह"],
    type: ["@प्रकार"],
    command: ["@कमांड"],
    similar: ["@मिलता"],
    similarity: ["@समानता"],
    prefix: ["@प्रीफिक्स"],
    bot: ["@बॉट"],
    total: ["@कुल"],
    desc: ["@विवरण"],
  },
  ur: {
    user: ["@صارف"],
    name: ["@نام"],
    group: ["@گروپ"],
    type: ["@قسم"],
    command: ["@کمانڈ"],
    similar: ["@مشابہ"],
    similarity: ["@مماثلت"],
    prefix: ["@پریفکس"],
    bot: ["@بوٹ"],
    total: ["@کل"],
    desc: ["@تفصیل"],
  },
  de: {
    user: ["@nutzer"],
    name: ["@name"],
    group: ["@gruppe"],
    type: ["@typ"],
    command: ["@befehl"],
    similar: ["@aehnlich"],
    similarity: ["@aehnlichkeit"],
    prefix: ["@praefix"],
    bot: ["@bot"],
    total: ["@gesamt"],
    desc: ["@beschreibung"],
  },
  tr: {
    user: ["@kullanici"],
    name: ["@isim"],
    group: ["@grup"],
    type: ["@tur"],
    command: ["@komut"],
    similar: ["@benzer"],
    similarity: ["@benzerlik"],
    prefix: ["@onek"],
    bot: ["@bot"],
    total: ["@toplam"],
    desc: ["@aciklama"],
  },
  bn: {
    user: ["@ব্যবহারকারী"],
    name: ["@নাম"],
    group: ["@গ্রুপ"],
    type: ["@ধরন"],
    command: ["@কমান্ড"],
    similar: ["@মিল"],
    similarity: ["@সাদৃশ্য"],
    prefix: ["@প্রিফিক্স"],
    bot: ["@বট"],
    total: ["@মোট"],
    desc: ["@বিবরণ"],
  },
};

const CANONICAL_TOKEN_VALUES: Record<TokenGroup, string> = {
  punishment: "punicao",
  delete: "apagar",
  ban: "banir",
  text: "texto",
  mode: "modo",
  mention: "mencao",
  on: "on",
  off: "off",
  reset: "reset",
  open: "open",
  close: "close",
};

function normalizeAscii(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}@]+/gu, "");
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function getLocalizedToken(locale: Locale, token: TokenGroup): string {
  return TOKEN_ALIASES[locale][token][0] ?? TOKEN_ALIASES.pt[token][0];
}

export function resolveLocalizedToken(locale: Locale, input: string | undefined, tokens: TokenGroup[]): string | null {
  if (!input) return null;

  const normalizedInput = normalizeAscii(input);
  for (const token of tokens) {
    const aliases = uniqueValues([...TOKEN_ALIASES.pt[token], ...TOKEN_ALIASES[locale][token]]);
    if (aliases.some((alias) => normalizeAscii(alias) === normalizedInput)) {
      return CANONICAL_TOKEN_VALUES[token];
    }
  }

  return null;
}

export function matchesLocalizedToken(locale: Locale, input: string | undefined, token: TokenGroup): boolean {
  return resolveLocalizedToken(locale, input, [token]) === CANONICAL_TOKEN_VALUES[token];
}

export function replaceLocalizedPlaceholders(
  template: string,
  locale: Locale,
  values: Partial<Record<PlaceholderGroup, string>>,
): string {
  let output = template;

  for (const key of Object.keys(values) as PlaceholderGroup[]) {
    const value = values[key];
    if (value === undefined) continue;

    const aliases = uniqueValues([...PLACEHOLDER_ALIASES.pt[key], ...PLACEHOLDER_ALIASES[locale][key]]);
    for (const alias of aliases) {
      output = output.replace(new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), value);
    }
  }

  return output;
}

export function getLocalizedPlaceholder(locale: Locale, token: PlaceholderGroup): string {
  return PLACEHOLDER_ALIASES[locale][token][0] ?? PLACEHOLDER_ALIASES.pt[token][0];
}

export function getLocalizedCommandWordVars(locale: Locale): Record<string, string> {
  return {
    punishment: getLocalizedToken(locale, "punishment"),
    delete: getLocalizedToken(locale, "delete"),
    ban: getLocalizedToken(locale, "ban"),
    text: getLocalizedToken(locale, "text"),
    mode: getLocalizedToken(locale, "mode"),
    mention: getLocalizedToken(locale, "mention"),
    on: getLocalizedToken(locale, "on"),
    off: getLocalizedToken(locale, "off"),
    reset: getLocalizedToken(locale, "reset"),
    open: getLocalizedToken(locale, "open"),
    close: getLocalizedToken(locale, "close"),
    userPlaceholder: getLocalizedPlaceholder(locale, "user"),
    namePlaceholder: getLocalizedPlaceholder(locale, "name"),
    groupPlaceholder: getLocalizedPlaceholder(locale, "group"),
    typePlaceholder: getLocalizedPlaceholder(locale, "type"),
    commandPlaceholder: getLocalizedPlaceholder(locale, "command"),
    similarPlaceholder: getLocalizedPlaceholder(locale, "similar"),
    similarityPlaceholder: getLocalizedPlaceholder(locale, "similarity"),
    prefixPlaceholder: getLocalizedPlaceholder(locale, "prefix"),
    botPlaceholder: getLocalizedPlaceholder(locale, "bot"),
    totalPlaceholder: getLocalizedPlaceholder(locale, "total"),
    descPlaceholder: getLocalizedPlaceholder(locale, "desc"),
  };
}
