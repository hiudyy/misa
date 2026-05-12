/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

export type Locale = "pt" | "es" | "en" | "id";

export const SUPPORTED_LOCALES: Locale[] = ["pt", "es", "en", "id"];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

type LocaleData = Record<string, unknown>;

// Cache dos locales em memória
const cache = new Map<Locale, LocaleData>();

function loadLocale(locale: Locale): LocaleData {
  const cached = cache.get(locale);
  if (cached) return cached;

  try {
    const filePath = path.join(__dirname, `${locale}.json`);
    const data = require(filePath) as LocaleData;
    cache.set(locale, data);
    return data;
  } catch {
    // Se falhar ao carregar o locale, tenta pt como fallback
    if (locale !== "pt") {
      return loadLocale("pt");
    }
    return {};
  }
}

function getNestedValue(obj: LocaleData, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Traduz uma chave para o locale especificado.
 * Interpolação: use {{varName}} nas strings do locale.
 * Fallback: locale → pt → própria chave.
 */
export function t(key: string, locale: Locale, vars?: Record<string, string>): string {
  let text: string | undefined;

  // Tenta no locale atual
  const localeData = loadLocale(locale);
  text = getNestedValue(localeData, key);

  // Fallback para pt
  if (text === undefined && locale !== "pt") {
    const ptData = loadLocale("pt");
    text = getNestedValue(ptData, key);
  }

  // Fallback para a própria chave
  if (text === undefined) {
    text = key;
  }

  // Interpolação de variáveis
  if (vars && text !== key) {
    for (const [varName, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{\\{${varName}\\}\\}`, "g"), value);
    }
  }

  return text;
}

/**
 * Cria um tradutor vinculado a um locale específico.
 * Atalho para não precisar passar o locale em cada chamada.
 */
export function createTranslator(locale: Locale): (key: string, vars?: Record<string, string>) => string {
  return (key: string, vars?: Record<string, string>) => t(key, locale, vars);
}

/**
 * Verifica se um locale é válido.
 */
export function isValidLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

/**
 * Retorna o idioma global configurado.
 */
export async function getGlobalLocale(): Promise<Locale> {
  const { getBotConfig } = await import("../config.js");
  const config = await getBotConfig();
  return config.language || "pt";
}

/**
 * Resolve o locale a ser usado (grupo sobrescreve o global).
 */
export async function resolveLocale(groupId?: string): Promise<Locale> {
  if (groupId && groupId.endsWith("@g.us")) {
    const { getGroup } = await import("../database/groupDB.js");
    const groupData = await getGroup(groupId);
    if (groupData.language && isValidLocale(groupData.language)) {
      return groupData.language;
    }
  }
  return getGlobalLocale();
}

/**
 * Limpa o cache de locales (útil para testes ou reload).
 */
export function clearLocaleCache(): void {
  cache.clear();
}

