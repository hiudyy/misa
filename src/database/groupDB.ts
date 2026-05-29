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
};

export type AntiLinkPunicao = "apagar" | "banir";

export type AntiLinkData = {
  ativo: boolean;
  punicao: AntiLinkPunicao;
  texto: string;
};

const DEFAULT: GroupData = {
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
      botBan: { ...DEFAULT.botBan, ...saved.botBan },
      antimidia: { ...DEFAULT.antimidia, ...saved.antimidia },
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
    botBan: { ...current.botBan, ...data.botBan },
    antimidia: { ...current.antimidia, ...data.antimidia },
    bemvindo: { ...current.bemvindo, ...data.bemvindo },
    antilink: { ...current.antilink, ...data.antilink },
    antilinkgp: { ...current.antilinkgp, ...data.antilinkgp },
    antilinkch: { ...current.antilinkch, ...data.antilinkch },
  };
  await fs.writeFile(groupPath(groupId), JSON.stringify(updated, null, 2), "utf8");
  return updated;
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
