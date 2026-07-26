/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { downloadMediaMessage, WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendSticker } from "../../../helpers/sticker.js";
import { localizeError } from "../../../helpers/localizeError.js";
import { assertMediaSize } from "../../../media/downloadToTemp.js";
import { runMediaJob } from "../../../media/runMediaJob.js";

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
    description: "Creates a sticker from a photo or video",
    category: "geral",
    async execute({ misa, message, from, sender, t }) {
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
      await runMediaJob({ misa, from, sender, kind: "sticker", t }, async (signal) => {
        await misa.sendMessage(from, { text: t("commands.sticker.creating") }, { quoted: message as WAMessage });
        try {
          assertMediaSize(imageMessage?.fileLength ?? videoMessage?.fileLength, videoMessage ? "video" : "image");
          const sourceIsDirectMedia = imageMessage ? Boolean(message.message?.imageMessage) : Boolean(message.message?.videoMessage);
          const messageToDownload = sourceIsDirectMedia ? message : { key: message.key, message: quoted! };
          const mediaBuffer = await downloadMediaMessage(
            messageToDownload as Parameters<typeof downloadMediaMessage>[0],
            "buffer",
            {},
          ) as Buffer;
          assertMediaSize(mediaBuffer.length, videoMessage ? "video" : "image");
          const config = await getBotConfig();
        await sendSticker(
          misa,
          from,
          {
            sticker: mediaBuffer,
            type: videoMessage ? "video" : "image",
            packname: config.botName,
            author: config.ownerName,
            forceSquare,
            signal,
          },
          { quoted: message as WAMessage },
        );
        } catch (error) {
          await misa.sendMessage(from, {
            text: t("commands.sticker.error", {
              message: localizeError(error, t, "commands.sticker.unknown"),
            }),
          }, { quoted: message as WAMessage });
        }
      });
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
