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

function formatViews(views: number): string {
  return new Intl.NumberFormat("pt-BR").format(views);
}

function sanitizeFileName(input: string): string {
  return input
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "video";
}

async function downloadYouTubeVideo(url: string): Promise<{
  buffer: Buffer;
  title: string;
  author: string;
  duration: number;
}> {
  const config = await getBotConfig();

  if (!config.apiKey) {
    throw new Error("API key não configurada. Configure em src/config.json");
  }

  const requestUrl = new URL("https://api.cognima.com.br/api/v1/youtube/download");
  requestUrl.searchParams.set("url", url);
  requestUrl.searchParams.set("format", "mp4");

  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("API key inválida");
    if (response.status === 403) throw new Error("Sem permissão para este endpoint");
    if (response.status === 429) throw new Error("Rate limit excedido. Tente novamente mais tarde");
    if (response.status === 400) throw new Error("Parâmetro inválido ou ausente");
    throw new Error(`Erro na API: ${response.status}`);
  }

  const title = response.headers.get("X-Title") || "Video";
  const author = response.headers.get("X-Author") || "Desconhecido";
  const duration = Number(response.headers.get("X-Duration") || "0");
  const buffer = Buffer.from(await response.arrayBuffer());

  return { buffer, title, author, duration };
}

const playvidCommand: Command = {
  name: "playvid",
  aliases: ["pv", "playvideo", "videoplay"],
  description: "Pesquisa um vídeo no YouTube e envia",
  category: "all",
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.playvid.usage"),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const query = args.join(" ").trim();

    await misa.sendMessage(from, { text: t("commands.playvid.searching") }, { quoted: message as WAMessage });

    try {
      const result = await misakaAPI<YouTubeSearchResponse>("/youtube/search", { q: query }, t);

      if (!result) {
        await misa.sendMessage(from, { text: t("commands.playvid.notFound") }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          image: { url: result.thumbnail },
          caption: [
            `🎬 *${result.title}*`,
            "",
            `👤 ${t("commands.playvid.channel")}: ${result.author}`,
            `⏱️ ${t("commands.playvid.duration")}: ${formatDuration(result.duration)}`,
            `👀 ${t("commands.playvid.views")}: ${formatViews(result.views)}`,
            "",
            t("commands.playvid.downloading"),
          ].join("\n"),
        },
        { quoted: message as WAMessage },
      );

      const video = await downloadYouTubeVideo(result.url);

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
          text: t("commands.playvid.error", { message: error instanceof Error ? error.message : t("commands.playvid.unknown") }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default playvidCommand;
