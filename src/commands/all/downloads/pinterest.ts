/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import {
  downloadPinterest,
  isValidPinURL,
  searchPinterest,
} from "../../../helpers/pinterestDownload.js";
import { localizeError } from "../../../helpers/localizeError.js";

const pinterestCommand: Command = {
  name: "pinterest",
  aliases: ["pin", "pint"],
  description: "Downloads Pinterest images or searches by term",
  category: "all",
  async execute({ misa, message, from, args, rawArgs, t }) {
    if (args.length === 0) {
      await misa.sendMessage(from, {
        text: t("commands.pinterest.usage"),
      });
      return;
    }

    const input = rawArgs;

    if (isValidPinURL(input)) {
      await misa.sendMessage(from, { text: t("commands.pinterest.downloading") }, { quoted: message as WAMessage });

      try {
        const data = await downloadPinterest(input);

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
            text: t("commands.pinterest.error", {
              message: localizeError(error, t, "commands.pinterest.unknown"),
            }),
          },
          { quoted: message as WAMessage },
        );
      }
      return;
    }

    await misa.sendMessage(from, { text: t("commands.pinterest.searching") }, { quoted: message as WAMessage });

    try {
      const images = await searchPinterest(input);

      if (images.length === 0) {
        await misa.sendMessage(from, { text: t("commands.pinterest.notFound") }, { quoted: message as WAMessage });
        return;
      }

      await misa.sendMessage(
        from,
        {
          text: t("commands.pinterest.found", { count: String(images.length) }),
        },
        { quoted: message as WAMessage },
      );

      const randomImg = images[Math.floor(Math.random() * images.length)];
      await misa.sendMessage(
        from,
        {
          image: { url: randomImg },
          caption: t("commands.pinterest.searchCaption", { query: input }),
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.pinterest.error", {
            message: localizeError(error, t, "commands.pinterest.unknown"),
          }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default pinterestCommand;
