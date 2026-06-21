/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig } from "../../../config.js";
import { misakaAPI } from "../../../helpers/misakaAPI.js";
import { Command } from "../../../types/Command.js";

type YouTubeSearchResponse = {
  video_id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
  views: number;
  author: string;
};

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatViews(views: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(views);
}

function sanitizeFileName(input: string): string {
  return input
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "audio";
}

async function downloadYouTubeAudio(
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
  requestUrl.searchParams.set("format", "mp3");

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

const playCommand: Command = {
  name: "play",
  aliases: ["p"],
  description: "Pesquisa uma música no YouTube e envia o áudio",
  category: "all",
  async execute({ misa, message, from, args, t, locale }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.play.usage"),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const query = args.join(" ").trim();

    await misa.sendMessage(from, { text: t("commands.play.searching") }, { quoted: message as WAMessage });

    try {
      const result = await misakaAPI<YouTubeSearchResponse>("/youtube/search", { q: query }, t);

      if (!result) {
        await misa.sendMessage(from, { text: t("commands.play.notFound") }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          image: { url: result.thumbnail },
          caption: [
            `🎵 *${result.title}*`,
            "",
            `👤 ${t("commands.play.channel")}: ${result.author}`,
            `⏱️ ${t("commands.play.duration")}: ${formatDuration(result.duration)}`,
            `👀 ${t("commands.play.views")}: ${formatViews(result.views, locale)}`,
            "",
            t("commands.play.downloading"),
          ].join("\n"),
        },
        { quoted: message as WAMessage },
      );

      const audio = await downloadYouTubeAudio(result.url, t);

      await misa.sendMessage(
        from,
        {
          audio: audio.buffer,
          mimetype: "audio/mpeg",
          fileName: `${sanitizeFileName(audio.title)}.mp3`,
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.play.error", { message: error instanceof Error ? error.message : t("commands.play.unknown") }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default playCommand;
