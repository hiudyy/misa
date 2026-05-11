/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "../config/paths.js";
import type { Locale } from "../i18n/index.js";

export type GroupData = {
  language?: Locale;
  bemvindo: {
    ativo: boolean;
    legenda: string;
    midia: { tipo: "imagem" | "video"; path: string } | null;
  };
  antilink: AntiLinkData;
  antilinkgp: AntiLinkData;
  antilinkch: AntiLinkData;
};

export type AntiLinkPunicao = "apagar" | "banir";

export type AntiLinkData = {
  ativo: boolean;
  punicao: AntiLinkPunicao;
  texto: string;
};

const DEFAULT: GroupData = {
  bemvindo: {
    ativo: false,
    legenda: "Seja bem-vindo(a), @usuario! 👋\nVocê é o membro de número @total do grupo *@grupo*.",
    midia: null,
  },
  antilink: {
    ativo: false,
    punicao: "apagar",
    texto: "🚫 @usuario, links não são permitidos neste grupo.",
  },
  antilinkgp: {
    ativo: false,
    punicao: "apagar",
    texto: "🚫 @usuario, links de grupo não são permitidos neste grupo.",
  },
  antilinkch: {
    ativo: false,
    punicao: "apagar",
    texto: "🚫 @usuario, links de canal não são permitidos neste grupo.",
  },
};

function groupPath(groupId: string): string {
  const id = groupId.replace("@g.us", "");
  return path.join(paths.grupos, `${id}.json`);
}

export async function getGroup(groupId: string): Promise<GroupData> {
  try {
    const raw = await fs.readFile(groupPath(groupId), "utf8");
    const saved = JSON.parse(raw) as Partial<GroupData>;
    return {
      ...DEFAULT,
      ...saved,
      bemvindo: { ...DEFAULT.bemvindo, ...saved.bemvindo },
      antilink: { ...DEFAULT.antilink, ...saved.antilink },
      antilinkgp: { ...DEFAULT.antilinkgp, ...saved.antilinkgp },
      antilinkch: { ...DEFAULT.antilinkch, ...saved.antilinkch },
    };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export async function saveGroup(groupId: string, data: Partial<GroupData>): Promise<GroupData> {
  await fs.mkdir(paths.grupos, { recursive: true });
  const current = await getGroup(groupId);
  const updated: GroupData = {
    ...current,
    ...data,
    bemvindo: { ...current.bemvindo, ...data.bemvindo },
    antilink: { ...current.antilink, ...data.antilink },
    antilinkgp: { ...current.antilinkgp, ...data.antilinkgp },
    antilinkch: { ...current.antilinkch, ...data.antilinkch },
  };
  await fs.writeFile(groupPath(groupId), JSON.stringify(updated, null, 2), "utf8");
  return updated;
}
