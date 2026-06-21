/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig } from "../../../config.js";
import { Command } from "../../../types/Command.js";

function sanitizeFileName(input: string): string {
  return input
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "video";
}

async function downloadYouTubeVideo(
  url: string,
  t: (key: string, vars?: Record<string, string>) => string,
): Promise<{
  buffer: Buffer;
  title: string;
  author: string;
  duration: number;
}> {
  const config = await getBotConfig();

  if (!config.apiKey) {
    throw new Error(t("api.errors.missingKey"));
  }

  const requestUrl = new URL("https://api.misaka.com.br/api/v1/youtube/download");
  requestUrl.searchParams.set("url", url);
  requestUrl.searchParams.set("format", "mp4");

  const response = await fetch(requestUrl, {
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

  const title = response.headers.get("X-Title") || t("common.file");
  const author = response.headers.get("X-Author") || t("common.unknown");
  const duration = Number(response.headers.get("X-Duration") || "0");
  const buffer = Buffer.from(await response.arrayBuffer());

  return { buffer, title, author, duration };
}

function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
  ];
  return patterns.some((pattern) => pattern.test(url));
}

const ytmp4Command: Command = {
  name: "ytmp4",
  aliases: ["ytvideo", "ytvid"],
  description: "Baixa vídeo do YouTube via link direto",
  category: "all",
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.ytmp4.usage") },
        { quoted: message as WAMessage },
      );
      return;
    }

    const url = args[0].trim();

    if (!isValidYouTubeUrl(url)) {
      await misa.sendMessage(
        from,
        { text: t("commands.ytmp4.invalidUrl") },
        { quoted: message as WAMessage },
      );
      return;
    }

    await misa.sendMessage(from, { text: t("commands.ytmp4.downloading") }, { quoted: message as WAMessage });

    try {
      const video = await downloadYouTubeVideo(url, t);

      await misa.sendMessage(
        from,
        {
          video: video.buffer,
          mimetype: "video/mp4",
          fileName: `${sanitizeFileName(video.title)}.mp4`,
          caption: `🎬 *${video.title}*\n👤 ${video.author}`,
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.ytmp4.error", { message: error instanceof Error ? error.message : t("commands.ytmp4.unknown") }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default ytmp4Command;
