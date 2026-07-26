/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "../config/paths.js";
import { DEFAULT_LOCALE, isValidLocale, t, type Locale } from "../i18n/index.js";
import { readJson, updateJson } from "../storage/jsonStore.js";
import { isValidPrefixSymbol } from "../helpers/resolveCommandPrefix.js";

export type GroupData = {
  language?: Locale;
  prefix?: string;
  botBan: {
    ativo: boolean;
    motivo: string | null;
    createdAt: string | null;
    createdBy: string | null;
  };
  soadmin: boolean;
  modobn: boolean;
  antimidia: {
    loc: boolean;
    audio: boolean;
    foto: boolean;
    video: boolean;
    doc: boolean;
    lista: boolean;
  };
  bemvindo: {
    ativo: boolean;
    legenda: string;
    midia: { tipo: "imagem" | "video"; path: string } | null;
  };
  antilink: AntiLinkData;
  antilinkgp: AntiLinkData;
  antilinkch: AntiLinkData;
  antistealth: boolean;
};

export type AntiLinkPunicao = "apagar" | "banir";

export type AntiLinkData = {
  ativo: boolean;
  punicao: AntiLinkPunicao;
  texto: string;
};

export const DEFAULT_GROUP: GroupData = {
  botBan: {
    ativo: false,
    motivo: null,
    createdAt: null,
    createdBy: null,
  },
  soadmin: false,
  modobn: false,
  antimidia: {
    loc: false,
    audio: false,
    foto: false,
    video: false,
    doc: false,
    lista: false,
  },
  bemvindo: {
    ativo: false,
    legenda: t("group.welcome.defaultLegend", DEFAULT_LOCALE),
    midia: null,
  },
  antilink: {
    ativo: false,
    punicao: "apagar",
    texto: t("group.antilink.defaultText", DEFAULT_LOCALE),
  },
  antilinkgp: {
    ativo: false,
    punicao: "apagar",
    texto: t("group.antilink.defaultGroupText", DEFAULT_LOCALE),
  },
  antilinkch: {
    ativo: false,
    punicao: "apagar",
    texto: t("group.antilink.defaultChannelText", DEFAULT_LOCALE),
  },
  antistealth: false,
};

function groupPath(groupId: string): string {
  const id = groupId.replace("@g.us", "");
  return path.join(paths.grupos, `${id}.json`);
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeAntiLink(value: unknown, defaults: AntiLinkData): AntiLinkData {
  const input = asObject(value);
  return {
    ativo: typeof input.ativo === "boolean" ? input.ativo : defaults.ativo,
    punicao: input.punicao === "banir" ? "banir" : "apagar",
    texto: typeof input.texto === "string" && input.texto.trim() ? input.texto : defaults.texto,
  };
}

export function normalizeGroupData(value: unknown): GroupData {
  const input = asObject(value);
  const botBan = asObject(input.botBan);
  const media = asObject(input.antimidia);
  const welcome = asObject(input.bemvindo);
  const welcomeMedia = asObject(welcome.midia);
  const normalizedWelcomeMedia: GroupData["bemvindo"]["midia"] = (welcomeMedia.tipo === "imagem" || welcomeMedia.tipo === "video")
    && typeof welcomeMedia.path === "string"
    ? { tipo: welcomeMedia.tipo, path: welcomeMedia.path }
    : null;

  return {
    ...(typeof input.language === "string" && isValidLocale(input.language) ? { language: input.language } : {}),
    ...(typeof input.prefix === "string" && isValidPrefixSymbol(input.prefix) ? { prefix: input.prefix } : {}),
    botBan: {
      ativo: typeof botBan.ativo === "boolean" ? botBan.ativo : false,
      motivo: optionalString(botBan.motivo),
      createdAt: optionalString(botBan.createdAt),
      createdBy: optionalString(botBan.createdBy),
    },
    soadmin: typeof input.soadmin === "boolean" ? input.soadmin : false,
    modobn: typeof input.modobn === "boolean" ? input.modobn : false,
    antimidia: {
      loc: typeof media.loc === "boolean" ? media.loc : false,
      audio: typeof media.audio === "boolean" ? media.audio : false,
      foto: typeof media.foto === "boolean" ? media.foto : false,
      video: typeof media.video === "boolean" ? media.video : false,
      doc: typeof media.doc === "boolean" ? media.doc : false,
      lista: typeof media.lista === "boolean" ? media.lista : false,
    },
    bemvindo: {
      ativo: typeof welcome.ativo === "boolean" ? welcome.ativo : false,
      legenda: typeof welcome.legenda === "string" && welcome.legenda.trim()
        ? welcome.legenda
        : DEFAULT_GROUP.bemvindo.legenda,
      midia: normalizedWelcomeMedia,
    },
    antilink: normalizeAntiLink(input.antilink, DEFAULT_GROUP.antilink),
    antilinkgp: normalizeAntiLink(input.antilinkgp, DEFAULT_GROUP.antilinkgp),
    antilinkch: normalizeAntiLink(input.antilinkch, DEFAULT_GROUP.antilinkch),
    antistealth: typeof input.antistealth === "boolean" ? input.antistealth : false,
  };
}

export async function getGroup(groupId: string): Promise<GroupData> {
  return readJson(groupPath(groupId), { defaultValue: DEFAULT_GROUP, normalize: normalizeGroupData });
}

export async function saveGroup(groupId: string, data: Partial<GroupData>): Promise<GroupData> {
  return updateJson(groupPath(groupId), { defaultValue: DEFAULT_GROUP, normalize: normalizeGroupData }, (current) => ({
    ...current,
    ...data,
    botBan: { ...current.botBan, ...data.botBan },
    antimidia: { ...current.antimidia, ...data.antimidia },
    bemvindo: { ...current.bemvindo, ...data.bemvindo },
    antilink: { ...current.antilink, ...data.antilink },
    antilinkgp: { ...current.antilinkgp, ...data.antilinkgp },
    antilinkch: { ...current.antilinkch, ...data.antilinkch },
  }));
}

export async function listBannedGroups(): Promise<Array<{ groupId: string; data: GroupData }>> {
  try {
    const files = await fs.readdir(paths.grupos);
    const entries = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => {
          const groupId = `${path.basename(file, ".json")}@g.us`;
          const data = await getGroup(groupId);
          return { groupId, data };
        }),
    );

    return entries.filter((entry) => entry.data.botBan.ativo);
  } catch {
    return [];
  }
}
