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
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(from, {
        text: t("commands.tiktok.usage"),
      });
      return;
    }

    const input = args.join(" ");
    const isUrl = input.includes("tiktok.com") || input.includes("vt.tiktok") || input.includes("vm.tiktok");

    // Se for URL, faz download
    if (isUrl) {
      await misa.sendMessage(from, { text: t("commands.tiktok.downloading") }, { quoted: message as WAMessage });

      try {
        const data = await misakaAPI<TikTokResponse>("/tiktok/download", { url: input }, t);

        if (!data) {
          await misa.sendMessage(from, { text: t("commands.tiktok.downloadFailed") }, { quoted: message as WAMessage });
          return;
        }

        if (data.type === "video") {
          await misa.sendMessage(
            from,
            {
              video: { url: data.urls[0] },
              caption: `🎵 *${data.title}*\n\n${t("commands.tiktok.downloadDone")}`,
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
                caption: data.urls.indexOf(imageUrl) === 0 ? `📸 *${data.title}*\n\n${t("commands.tiktok.downloadDone")}` : undefined,
              },
              { quoted: message as WAMessage },
            );
          }
        }
      } catch (error) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.tiktok.error", { message: error instanceof Error ? error.message : t("commands.tiktok.unknown") }),
          },
          { quoted: message as WAMessage },
        );
      }
      return;
    }

    // Se não for URL, faz pesquisa
    await misa.sendMessage(from, { text: t("commands.tiktok.searching") }, { quoted: message as WAMessage });

    try {
      const data = await misakaAPI<TikTokResponse>("/tiktok/search", { q: input }, t);

      if (!data) {
        await misa.sendMessage(from, { text: t("commands.tiktok.notFound") }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          text: t("commands.tiktok.found", { title: data.title }),
        },
        { quoted: message as WAMessage },
      );

      if (data.type === "video") {
        await misa.sendMessage(
          from,
          {
            video: { url: data.urls[0] },
            caption: `🎵 *${data.title}*\n\n${t("commands.tiktok.searchCaption", { query: input })}`,
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
              caption: data.urls.indexOf(url) === 0 ? `📸 *${data.title}*\n\n${t("commands.tiktok.searchCaption", { query: input })}` : undefined,
            },
            { quoted: message as WAMessage },
          );
        }
      }
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.tiktok.error", { message: error instanceof Error ? error.message : t("commands.tiktok.unknown") }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default tiktokCommand;
