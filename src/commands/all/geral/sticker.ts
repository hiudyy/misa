/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { downloadMediaMessage, WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendSticker } from "../../../helpers/sticker.js";

const MAX_VIDEO_SECONDS = 15;

export function createStickerCommand(
  name: "sticker" | "sticker2",
  aliases: string[],
  usageKey: "commands.sticker.usage" | "commands.sticker2.usage",
  forceSquare: boolean,
): Command {
  return {
    name,
    aliases,
    description: "Cria figurinha de foto ou vídeo",
    category: "geral",
    async execute({ misa, message, from, t }) {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imageMessage = message.message?.imageMessage ?? quoted?.imageMessage ?? null;
      const videoMessage = message.message?.videoMessage ?? quoted?.videoMessage ?? null;

      if (!imageMessage && !videoMessage) {
        await misa.sendMessage(from, { text: t(usageKey) }, { quoted: message as WAMessage });
        return;
      }

      if (videoMessage && (videoMessage.seconds ?? 0) > MAX_VIDEO_SECONDS) {
        await misa.sendMessage(
          from,
          { text: t("commands.sticker.videoTooLong", { max: String(MAX_VIDEO_SECONDS) }) },
          { quoted: message as WAMessage },
        );
        return;
      }

      await misa.sendMessage(from, { text: t("commands.sticker.creating") }, { quoted: message as WAMessage });

      const sourceIsDirectMedia = imageMessage ? Boolean(message.message?.imageMessage) : Boolean(message.message?.videoMessage);
      const messageToDownload = sourceIsDirectMedia ? message : { key: message.key, message: quoted! };
      const mediaBuffer = await downloadMediaMessage(
        messageToDownload as Parameters<typeof downloadMediaMessage>[0],
        "buffer",
        {},
      ) as Buffer;
      const config = await getBotConfig();

      try {
        await sendSticker(
          misa,
          from,
          {
            sticker: mediaBuffer,
            type: videoMessage ? "video" : "image",
            packname: config.botName,
            author: config.ownerName,
            forceSquare,
          },
          { quoted: message as WAMessage },
        );
      } catch (error) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.sticker.error", {
              message: error instanceof Error ? error.message : t("commands.sticker.unknown"),
            }),
          },
          { quoted: message as WAMessage },
        );
      }
    },
  };
}

const stickerCommand = createStickerCommand(
  "sticker",
  ["s", "fig", "figurinha"],
  "commands.sticker.usage",
  true,
);

export default stickerCommand;
