/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { misakaAPI } from "../../../helpers/misakaAPI.js";

type InstagramResponse = {
  medias: Array<{
    type: "video" | "image";
    url: string;
  }>;
  count: number;
};

const instagramCommand: Command = {
  name: "instagram",
  aliases: ["ig", "insta"],
  description: "Baixa fotos e vídeos do Instagram",
  category: "all",
  async execute({ misa, message, from, args }) {
    if (args.length === 0) {
      await misa.sendMessage(from, {
        text: [
          "╭─「 *INSTAGRAM* 」",
          "│",
          "│ ✦ Download:",
          "│   instagram <url>",
          "│",
          "╰─ Exemplo:",
          "   instagram https://instagram.com/p/...",
        ].join("\n"),
      });
      return;
    }

    const url = args[0];

    if (!url.includes("instagram.com")) {
      await misa.sendMessage(from, { text: "❌ URL inválida. Use uma URL do Instagram." }, { quoted: message as WAMessage });
      return;
    }

    await misa.sendMessage(from, { text: "⬇️ Baixando do Instagram..." }, { quoted: message as WAMessage });

    try {
      const data = await misakaAPI<InstagramResponse>("/instagram/download", { url });

      if (!data || data.count === 0) {
        await misa.sendMessage(from, { text: "❌ Não foi possível baixar o conteúdo." }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          text: `📥 Enviando ${data.count} ${data.count === 1 ? "arquivo" : "arquivos"}...`,
        },
        { quoted: message as WAMessage },
      );

      for (const media of data.medias) {
        if (media.type === "video") {
          await misa.sendMessage(
            from,
            {
              video: { url: media.url },
              caption: data.medias.indexOf(media) === 0 ? "✅ Download do Instagram concluído!" : undefined,
            },
            { quoted: message as WAMessage },
          );
        } else {
          await misa.sendMessage(
            from,
            {
              image: { url: media.url },
              caption: data.medias.indexOf(media) === 0 ? "✅ Download do Instagram concluído!" : undefined,
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

export default instagramCommand;
