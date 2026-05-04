/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { misakaAPI } from "../../../helpers/misakaAPI.js";

type PinterestDownloadResponse = {
  url: string;
  type: "image" | "video";
};

type PinterestSearchResponse = {
  images: string[];
};

const pinterestCommand: Command = {
  name: "pinterest",
  aliases: ["pin", "pint"],
  description: "Baixa imagens do Pinterest ou pesquisa por termo",
  category: "all",
  async execute({ misa, message, from, args }) {
    if (args.length === 0) {
      await misa.sendMessage(from, {
        text: [
          "╭─「 *PINTEREST* 」",
          "│",
          "│ ✦ Download:",
          "│   pinterest <url>",
          "│",
          "│ ✦ Pesquisa:",
          "│   pinterest <termo>",
          "│",
          "╰─ Exemplos:",
          "   pinterest https://pin.it/...",
          "   pinterest wallpaper 4k",
        ].join("\n"),
      });
      return;
    }

    const input = args.join(" ");
    const isUrl = input.includes("pinterest.com") || input.includes("pin.it");

    // Se for URL, faz download
    if (isUrl) {
      await misa.sendMessage(from, { text: "⬇️ Baixando do Pinterest..." }, { quoted: message as WAMessage });

      try {
        const data = await misakaAPI<PinterestDownloadResponse>("/pinterest/download", { url: input });

        if (!data) {
          await misa.sendMessage(from, { text: "❌ Não foi possível baixar o conteúdo." }, { quoted: message as WAMessage });
          return;
        }

        if (data.type === "video") {
          await misa.sendMessage(
            from,
            {
              video: { url: data.url },
              caption: "✅ Download do Pinterest concluído!",
            },
            { quoted: message as WAMessage },
          );
        } else {
          await misa.sendMessage(
            from,
            {
              image: { url: data.url },
              caption: "✅ Download do Pinterest concluído!",
            },
            { quoted: message as WAMessage },
          );
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
    await misa.sendMessage(from, { text: "🔍 Pesquisando no Pinterest..." }, { quoted: message as WAMessage });

    try {
      const data = await misakaAPI<PinterestSearchResponse>("/pinterest/search", { q: input });

      if (!data || data.images.length === 0) {
        await misa.sendMessage(from, { text: "❌ Nenhum resultado encontrado." }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          text: `📸 Encontrei ${data.images.length} imagens!\n\n⬇️ Enviando...`,
        },
        { quoted: message as WAMessage },
      );

      // Envia até 5 imagens
      const limit = Math.min(data.images.length, 5);
      for (let i = 0; i < limit; i++) {
        await misa.sendMessage(
          from,
          {
            image: { url: data.images[i] },
            caption: i === 0 ? `🔍 Pesquisa: ${input}` : undefined,
          },
          { quoted: message as WAMessage },
        );
      }

      if (data.images.length > 5) {
        await misa.sendMessage(
          from,
          {
            text: `ℹ️ Foram encontradas ${data.images.length} imagens, mas enviei apenas 5.`,
          },
          { quoted: message as WAMessage },
        );
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

export default pinterestCommand;
