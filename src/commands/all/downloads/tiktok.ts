/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { misakaAPI } from "../../../helpers/misakaAPI.js";

type TikTokResponse = {
  urls: string[];
  type: "video" | "image";
  title: string;
  audio: string;
};

const tiktokCommand: Command = {
  name: "tiktok",
  aliases: ["ttk", "tt"],
  description: "Baixa vídeos do TikTok ou pesquisa por termo",
  category: "all",
  async execute({ misa, message, from, args }) {
    if (args.length === 0) {
      await misa.sendMessage(from, {
        text: [
          "╭─「 *TIKTOK* 」",
          "│",
          "│ ✦ Download:",
          "│   tiktok <url>",
          "│",
          "│ ✦ Pesquisa:",
          "│   tiktok <termo>",
          "│",
          "╰─ Exemplos:",
          "   tiktok https://vm.tiktok.com/...",
          "   tiktok dança viral",
        ].join("\n"),
      });
      return;
    }

    const input = args.join(" ");
    const isUrl = input.includes("tiktok.com") || input.includes("vt.tiktok") || input.includes("vm.tiktok");

    // Se for URL, faz download
    if (isUrl) {
      await misa.sendMessage(from, { text: "⬇️ Baixando do TikTok..." }, { quoted: message as WAMessage });

      try {
        const data = await misakaAPI<TikTokResponse>("/tiktok/download", { url: input });

        if (!data) {
          await misa.sendMessage(from, { text: "❌ Não foi possível baixar o vídeo." }, { quoted: message as WAMessage });
          return;
        }

        if (data.type === "video") {
          await misa.sendMessage(
            from,
            {
              video: { url: data.urls[0] },
              caption: `🎵 *${data.title}*\n\n✅ Download concluído!`,
            },
            { quoted: message as WAMessage },
          );
        } else {
          // Múltiplas imagens
          for (const imageUrl of data.urls) {
            await misa.sendMessage(
              from,
              {
                image: { url: imageUrl },
                caption: data.urls.indexOf(imageUrl) === 0 ? `📸 *${data.title}*\n\n✅ Download concluído!` : undefined,
              },
              { quoted: message as WAMessage },
            );
          }
        }
      } catch (error) {
        await misa.sendMessage(
          from,
          {
            text: `❌ Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          },
          { quoted: message as WAMessage },
        );
      }
      return;
    }

    // Se não for URL, faz pesquisa
    await misa.sendMessage(from, { text: "🔍 Pesquisando no TikTok..." }, { quoted: message as WAMessage });

    try {
      const data = await misakaAPI<TikTokResponse>("/tiktok/search", { q: input });

      if (!data) {
        await misa.sendMessage(from, { text: "❌ Nenhum resultado encontrado." }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          text: `📹 *${data.title}*\n\n⬇️ Baixando...`,
        },
        { quoted: message as WAMessage },
      );

      if (data.type === "video") {
        await misa.sendMessage(
          from,
          {
            video: { url: data.urls[0] },
            caption: `🎵 *${data.title}*\n\n🔍 Pesquisa: ${input}`,
          },
          { quoted: message as WAMessage },
        );
      } else {
        // Múltiplas imagens
        for (const url of data.urls) {
          await misa.sendMessage(
            from,
            {
              image: { url },
              caption: data.urls.indexOf(url) === 0 ? `📸 *${data.title}*\n\n🔍 Pesquisa: ${input}` : undefined,
            },
            { quoted: message as WAMessage },
          );
        }
      }
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

export default tiktokCommand;
