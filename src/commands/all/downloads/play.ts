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
    .slice(0, 120) || "audio";
}

async function downloadYouTubeAudio(url: string): Promise<{
  buffer: Buffer;
  title: string;
  author: string;
  duration: number;
}> {
  const config = await getBotConfig();

  if (!config.apiKey) {
    throw new Error("API key não configurada. Configure em src/config.json");
  }

  const requestUrl = new URL("https://misaka.com.br/api/v1/youtube/download");
  requestUrl.searchParams.set("url", url);
  requestUrl.searchParams.set("format", "mp3");

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

  const title = response.headers.get("X-Title") || "Audio";
  const author = response.headers.get("X-Author") || "Desconhecido";
  const duration = Number(response.headers.get("X-Duration") || "0");
  const buffer = Buffer.from(await response.arrayBuffer());

  return { buffer, title, author, duration };
}

const playCommand: Command = {
  name: "play",
  aliases: ["p"],
  description: "Pesquisa uma música no YouTube e envia o áudio",
  category: "all",
  async execute({ misa, message, from, args }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        {
          text: [
            "╭─「 *PLAY* 」",
            "│",
            "│ ✦ Pesquisa:",
            "│   play <nome da música>",
            "│   p <nome da música>",
            "│",
            "╰─ Exemplo:",
            "   play michael jackson billie jean",
          ].join("\n"),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const query = args.join(" ").trim();

    await misa.sendMessage(from, { text: "🔍 Pesquisando música..." }, { quoted: message as WAMessage });

    try {
      const result = await misakaAPI<YouTubeSearchResponse>("/youtube/search", { q: query });

      if (!result) {
        await misa.sendMessage(from, { text: "❌ Nenhum resultado encontrado." }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          image: { url: result.thumbnail },
          caption: [
            `🎵 *${result.title}*`,
            "",
            `👤 Canal: ${result.author}`,
            `⏱️ Duração: ${formatDuration(result.duration)}`,
            `👁️ Views: ${formatViews(result.views)}`,
            "",
            "⬇️ Baixando áudio...",
          ].join("\n"),
        },
        { quoted: message as WAMessage },
      );

      const audio = await downloadYouTubeAudio(result.url);

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
          text: `❌ Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default playCommand;
