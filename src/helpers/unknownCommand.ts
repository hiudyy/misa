/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { proto, WAMessage, WASocket } from "baileys";
import { getBotConfig } from "../config.js";
import { getOwnerConfig } from "../ownerConfig.js";
import type { Locale } from "../i18n/index.js";

type SimilarCommand = {
  name: string;
  percentage: number;
};

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function getSimilarity(input: string, candidate: string): number {
  if (!input && !candidate) return 100;

  const distance = levenshtein(input, candidate);
  const maxLength = Math.max(input.length, candidate.length, 1);
  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}

export function findSimilarCommand(input: string, commandNames: string[]): SimilarCommand | null {
  let bestMatch: SimilarCommand | null = null;

  for (const candidate of commandNames) {
    const percentage = getSimilarity(input, candidate);
    if (!bestMatch || percentage > bestMatch.percentage) {
      bestMatch = { name: candidate, percentage };
    }
  }

  if (!bestMatch || bestMatch.percentage < 35) return null;
  return bestMatch;
}

function getDisplayName(message: proto.IWebMessageInfo, sender: string): string {
  const pushName = message.pushName?.trim();
  if (pushName) return pushName;
  return sender.split("@")[0];
}

export async function sendUnknownCommandMessage(
  misa: WASocket,
  from: string,
  sender: string,
  prefix: string,
  commandName: string,
  similar: SimilarCommand | null,
  message: proto.IWebMessageInfo,
  locale: Locale,
): Promise<void> {
  const [config, ownerConfig] = await Promise.all([getBotConfig(), getOwnerConfig()]);
  const { t } = await import("../i18n/index.js");

  if (ownerConfig.comandoNaoEncontrado.modo === "mencao") {
    await misa.sendMessage(
      from,
      {
        text: `@${sender.split("@")[0]}`,
        mentions: [sender],
      },
      { quoted: message as WAMessage },
    );
    return;
  }

  const nome = getDisplayName(message, sender);
  const parecido = similar ? `${prefix}${similar.name}` : t("common.none", locale);
  const similaridade = similar ? `${similar.percentage}%` : "0%";
  
  // Se o texto salvo é exatamente o default em PT, nós podemos usar a versão traduzida dinamicamente.
  let template = ownerConfig.comandoNaoEncontrado.texto;
  if (template === t("owner.cmdnf.defaultText", "pt")) {
    template = t("owner.cmdnf.defaultText", locale);
  }

  const texto = template
    .replace(/@usuario/g, `@${sender.split("@")[0]}`)
    .replace(/@nome/g, nome)
    .replace(/@comando/g, `${prefix}${commandName}`)
    .replace(/@parecido/g, parecido)
    .replace(/@similaridade/g, similaridade)
    .replace(/@prefixo/g, prefix)
    .replace(/@bot/g, config.botName);

  await misa.sendMessage(
    from,
    {
      text: texto,
      mentions: [sender],
    },
    { quoted: message as WAMessage },
  );
}
