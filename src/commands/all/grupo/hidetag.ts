/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { downloadMediaMessage, proto } from "baileys";
import { Command } from "../../../types/Command.js";
import { assertMediaSize } from "../../../media/downloadToTemp.js";
import { runMediaJob } from "../../../media/runMediaJob.js";

type MediaKind = "image" | "video" | "sticker" | "audio" | "document";

function resolveMediaSource(message: proto.IWebMessageInfo): {
  kind: MediaKind;
  toDownload: proto.IWebMessageInfo;
  mimetype?: string | null;
  ptt?: boolean | null;
  fileName?: string | null;
  fileLength?: number | { toString(): string } | null;
} | null {
  const msg = message.message;
  if (!msg) return null;

  const quoted = msg.extendedTextMessage?.contextInfo?.quotedMessage;
  const directImage = msg.imageMessage;
  const directVideo = msg.videoMessage;
  const directSticker = msg.stickerMessage;
  const directAudio = msg.audioMessage;
  const directDocument = msg.documentMessage;

  if (directImage) {
    return { kind: "image", toDownload: message, fileLength: directImage.fileLength };
  }
  if (directVideo) {
    return { kind: "video", toDownload: message, fileLength: directVideo.fileLength };
  }
  if (directSticker) {
    return { kind: "sticker", toDownload: message, fileLength: directSticker.fileLength };
  }
  if (directAudio) {
    return { kind: "audio", toDownload: message, mimetype: directAudio.mimetype, ptt: directAudio.ptt, fileLength: directAudio.fileLength };
  }
  if (directDocument) {
    return {
      kind: "document",
      toDownload: message,
      mimetype: directDocument.mimetype,
      fileName: directDocument.fileName,
      fileLength: directDocument.fileLength,
    };
  }

  if (!quoted) return null;

  if (quoted.imageMessage) {
    return { kind: "image", toDownload: { key: message.key, message: quoted }, fileLength: quoted.imageMessage.fileLength };
  }
  if (quoted.videoMessage) {
    return { kind: "video", toDownload: { key: message.key, message: quoted }, fileLength: quoted.videoMessage.fileLength };
  }
  if (quoted.stickerMessage) {
    return { kind: "sticker", toDownload: { key: message.key, message: quoted }, fileLength: quoted.stickerMessage.fileLength };
  }
  if (quoted.audioMessage) {
    return {
      kind: "audio",
      toDownload: { key: message.key, message: quoted },
      mimetype: quoted.audioMessage.mimetype,
      ptt: quoted.audioMessage.ptt,
      fileLength: quoted.audioMessage.fileLength,
    };
  }
  if (quoted.documentMessage) {
    return {
      kind: "document",
      toDownload: { key: message.key, message: quoted },
      mimetype: quoted.documentMessage.mimetype,
      fileName: quoted.documentMessage.fileName,
      fileLength: quoted.documentMessage.fileLength,
    };
  }

  return null;
}

const hidetagCommand: Command = {
  name: "hidetag",
  aliases: ["tag", "totag", "marcartodos", "everyone", "todos"],
  description: "Mentions all group members (hidden)",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from, sender, args, rawArgs, groupCache, t }) {
    const groupMeta = await groupCache.ensure(from, misa);

    if (!groupMeta) {
      await misa.sendMessage(from, { text: t("commands.hidetag.fetchError") });
      return;
    }

    const mentions = groupMeta.participants.map((p) => p.id);

    if (mentions.length === 0) {
      await misa.sendMessage(from, { text: t("commands.hidetag.noMembers") });
      return;
    }

    const caption = args.length > 0 ? rawArgs : "";
    const media = resolveMediaSource(message as proto.IWebMessageInfo);

    if (media) {
      try {
        assertMediaSize(media.fileLength, media.kind);
      } catch {
        await misa.sendMessage(from, { text: t("errors.media.tooLarge") });
        return;
      }
      await runMediaJob({ misa, from, sender, kind: "hidetag-media", t }, async () => {
        try {
          const buffer = (await downloadMediaMessage(
            media.toDownload as Parameters<typeof downloadMediaMessage>[0],
            "buffer",
            {},
          )) as Buffer;
          assertMediaSize(buffer.length, media.kind);

          if (media.kind === "image") await misa.sendMessage(from, { image: buffer, caption, mentions });
          else if (media.kind === "video") await misa.sendMessage(from, { video: buffer, caption, mentions });
          else if (media.kind === "sticker") await misa.sendMessage(from, { sticker: buffer, mentions });
          else if (media.kind === "audio") {
            await misa.sendMessage(from, {
              audio: buffer,
              mimetype: media.mimetype || "audio/ogg; codecs=opus",
              ptt: Boolean(media.ptt),
              mentions,
            });
          } else {
            await misa.sendMessage(from, {
              document: buffer,
              mimetype: media.mimetype || "application/octet-stream",
              fileName: media.fileName || "file",
              caption,
              mentions,
            });
          }
        } catch {
          await misa.sendMessage(from, { text: t("commands.hidetag.mediaError") });
        }
      });
      return;
    }

    const text = caption || t("commands.hidetag.defaultMessage");
    await misa.sendMessage(from, { text, mentions });
  },
};

export default hidetagCommand;
