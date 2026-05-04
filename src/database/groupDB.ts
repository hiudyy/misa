/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "../config/paths.js";

export type GroupData = {
  bemvindo: {
    ativo: boolean;
    legenda: string;
    midia: { tipo: "imagem" | "video"; path: string } | null;
  };
  // novas features podem ser adicionadas aqui
};

const DEFAULT: GroupData = {
  bemvindo: {
    ativo: false,
    legenda: "Seja bem-vindo(a), @usuario! 👋\nVocê é o membro de número @total do grupo *@grupo*.",
    midia: null,
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
  };
  await fs.writeFile(groupPath(groupId), JSON.stringify(updated, null, 2), "utf8");
  return updated;
}
