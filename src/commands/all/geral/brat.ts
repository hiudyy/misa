/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig } from "../../../config.js";
import { sendSticker } from "../../../helpers/sticker.js";
import { Command } from "../../../types/Command.js";

async function generateBratImage(text: string, style: "white" | "green", t: (key: string, vars?: Record<string, string>) => string): Promise<Buffer> {
  const config = await getBotConfig();

  if (!config.apiKey) {
    throw new Error(t("api.errors.missingKey"));
  }

  const url = new URL("https://misaka.com.br/api/v1/image/brat");
  url.searchParams.set("text", text);
  url.searchParams.set("style", style);
  url.searchParams.set("blur", "7");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error(t("api.errors.invalidKey"));
    if (response.status === 403) throw new Error(t("api.errors.forbidden"));
    if (response.status === 429) throw new Error(t("api.errors.rateLimit"));
    if (response.status === 400) throw new Error(t("api.errors.invalidParam"));
    throw new Error(t("api.errors.serverError", { status: String(response.status) }));
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error(t("commands.brat.empty"));
  }

  return buffer;
}

export function createBratCommand(
  name: "brat" | "brat2",
  style: "white" | "green",
  usageKey: "commands.brat.usage" | "commands.brat2.usage",
): Command {
  return {
    name,
    description: "Cria figurinha no estilo brat a partir de texto",
    category: "geral",
    async execute({ misa, message, from, args, t }) {
      if (args.length === 0) {
        await misa.sendMessage(from, { text: t(usageKey) }, { quoted: message as WAMessage });
        return;
      }

      const text = args.join(" ").trim();

      await misa.sendMessage(
        from,
        { text: t("commands.brat.creating") },
        { quoted: message as WAMessage },
      );

      try {
        const imageBuffer = await generateBratImage(text, style, t);
        const config = await getBotConfig();

        await sendSticker(
          misa,
          from,
          {
            sticker: imageBuffer,
            type: "image",
            packname: config.botName,
            author: config.ownerName,
          },
          { quoted: message as WAMessage },
        );
      } catch (error) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.brat.error", {
              message: error instanceof Error ? error.message : t("commands.brat.unknown"),
            }),
          },
          { quoted: message as WAMessage },
        );
      }
    },
  };
}

const bratCommand = createBratCommand("brat", "white", "commands.brat.usage");

export default bratCommand;
