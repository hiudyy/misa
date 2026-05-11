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
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(from, {
        text: t("commands.pinterest.usage"),
      });
      return;
    }

    const input = args.join(" ");
    const isUrl = input.includes("pinterest.com") || input.includes("pin.it");

    // Se for URL, faz download
    if (isUrl) {
      await misa.sendMessage(from, { text: t("commands.pinterest.downloading") }, { quoted: message as WAMessage });

      try {
        const data = await misakaAPI<PinterestDownloadResponse>("/pinterest/download", { url: input }, t);

        if (!data) {
          await misa.sendMessage(from, { text: t("commands.pinterest.downloadFailed") }, { quoted: message as WAMessage });
          return;
        }

        if (data.type === "video") {
          await misa.sendMessage(
            from,
            {
              video: { url: data.url },
              caption: t("commands.pinterest.done"),
            },
            { quoted: message as WAMessage },
          );
        } else {
          await misa.sendMessage(
            from,
            {
              image: { url: data.url },
              caption: t("commands.pinterest.done"),
            },
            { quoted: message as WAMessage },
          );
        }
      } catch (error) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.pinterest.error", { message: error instanceof Error ? error.message : t("commands.pinterest.unknown") }),
          },
          { quoted: message as WAMessage },
        );
      }
      return;
    }

    // Se não for URL, faz pesquisa
    await misa.sendMessage(from, { text: t("commands.pinterest.searching") }, { quoted: message as WAMessage });

    try {
      const data = await misakaAPI<PinterestSearchResponse>("/pinterest/search", { q: input }, t);

      if (!data || data.images.length === 0) {
        await misa.sendMessage(from, { text: t("commands.pinterest.notFound") }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          text: t("commands.pinterest.found", { count: String(data.images.length) }),
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
            caption: i === 0 ? t("commands.pinterest.searchCaption", { query: input }) : undefined,
          },
          { quoted: message as WAMessage },
        );
      }

      if (data.images.length > 5) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.pinterest.limited", { total: String(data.images.length), sent: "5" }),
          },
          { quoted: message as WAMessage },
        );
      }
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.pinterest.error", { message: error instanceof Error ? error.message : t("commands.pinterest.unknown") }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default pinterestCommand;
