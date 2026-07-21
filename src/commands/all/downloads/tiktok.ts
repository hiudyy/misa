/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import {
  downloadTiktok,
  isValidTiktokURL,
  searchTiktok,
  type TiktokDownloadResult,
} from "../../../helpers/tiktokDownload.js";
import { ErrorCode, isErrorCode, localizeError } from "../../../helpers/localizeError.js";

async function sendTiktokResult(
  misa: import("baileys").WASocket,
  from: string,
  message: WAMessage,
  data: TiktokDownloadResult,
  caption: string,
): Promise<void> {
  if (data.type === "image") {
    for (let i = 0; i < data.urls.length; i++) {
      await misa.sendMessage(
        from,
        {
          image: { url: data.urls[i] },
          caption: i === 0 ? caption : undefined,
        },
        { quoted: message },
      );
    }
  } else if (data.urls[0]) {
    await misa.sendMessage(
      from,
      {
        video: { url: data.urls[0] },
        caption,
      },
      { quoted: message },
    );
  }

  if (data.audio) {
    await misa.sendMessage(
      from,
      {
        audio: { url: data.audio },
        mimetype: "audio/mpeg",
      },
      { quoted: message },
    );
  }
}

const tiktokCommand: Command = {
  name: "tiktok",
  aliases: ["ttk", "tt"],
  description: "Downloads TikTok videos or searches by term",
  category: "all",
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(from, {
        text: t("commands.tiktok.usage"),
      });
      return;
    }

    const input = args.join(" ");

    if (isValidTiktokURL(input)) {
      await misa.sendMessage(from, { text: t("commands.tiktok.downloading") }, { quoted: message as WAMessage });

      try {
        const data = await downloadTiktok(input);
        const caption = `🎵 *${data.title}*\n\n${t("commands.tiktok.downloadDone")}`;
        await sendTiktokResult(misa, from, message as WAMessage, data, caption);
      } catch (error) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.tiktok.error", {
              message: localizeError(error, t, "commands.tiktok.unknown"),
            }),
          },
          { quoted: message as WAMessage },
        );
      }
      return;
    }

    await misa.sendMessage(from, { text: t("commands.tiktok.searching") }, { quoted: message as WAMessage });

    try {
      const data = await searchTiktok(input);

      await misa.sendMessage(
        from,
        {
          text: t("commands.tiktok.found", { title: data.title }),
        },
        { quoted: message as WAMessage },
      );

      const caption = `🎵 *${data.title}*\n\n${t("commands.tiktok.searchCaption", { query: input })}`;
      await sendTiktokResult(misa, from, message as WAMessage, data, caption);
    } catch (error) {
      const messageText =
        isErrorCode(error, ErrorCode.DOWNLOAD_NOT_FOUND)
          ? t("commands.tiktok.notFound")
          : t("commands.tiktok.error", {
              message: localizeError(error, t, "commands.tiktok.unknown"),
            });

      await misa.sendMessage(from, { text: messageText }, { quoted: message as WAMessage });
    }
  },
};

export default tiktokCommand;
