/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const hidetagCommand: Command = {
  name: "hidetag",
  aliases: ["tag", "totag", "marcartodos", "everyone", "todos"],
  description: "Menciona todos os membros do grupo (oculto)",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from, args, groupCache, t }) {
    const groupMeta = await groupCache.ensure(from, misa);

    if (!groupMeta) {
      await misa.sendMessage(from, { text: t("commands.hidetag.fetchError") }, { quoted: message as WAMessage });
      return;
    }

    const mentions = groupMeta.participants.map((p) => p.id);

    if (mentions.length === 0) {
      await misa.sendMessage(from, { text: t("commands.hidetag.noMembers") }, { quoted: message as WAMessage });
      return;
    }

    const msg = message.message;
    const caption = args.length > 0 ? args.join(" ") : "";

    // Check for quoted message
    const quotedMsg = msg?.extendedTextMessage?.contextInfo?.quotedMessage;
    const hasQuotedMedia = quotedMsg && (
      quotedMsg.imageMessage || 
      quotedMsg.videoMessage || 
      quotedMsg.stickerMessage || 
      quotedMsg.audioMessage ||
      quotedMsg.documentMessage
    );

    // 1. Quoted image
    if (quotedMsg?.imageMessage) {
      const mediaUrl = quotedMsg.imageMessage.url;
      if (mediaUrl) {
        await misa.sendMessage(
          from,
          {
            image: { url: mediaUrl },
            caption: caption || quotedMsg.imageMessage.caption || "",
            mentions,
          },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 2. Quoted video
    if (quotedMsg?.videoMessage) {
      const mediaUrl = quotedMsg.videoMessage.url;
      if (mediaUrl) {
        await misa.sendMessage(
          from,
          {
            video: { url: mediaUrl },
            caption: caption || quotedMsg.videoMessage.caption || "",
            mentions,
          },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 3. Quoted sticker
    if (quotedMsg?.stickerMessage) {
      const mediaUrl = quotedMsg.stickerMessage.url;
      if (mediaUrl) {
        await misa.sendMessage(
          from,
          { sticker: { url: mediaUrl }, mentions },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 4. Quoted audio
    if (quotedMsg?.audioMessage) {
      const mediaUrl = quotedMsg.audioMessage.url;
      if (mediaUrl) {
        await misa.sendMessage(
          from,
          { audio: { url: mediaUrl }, mentions },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 5. Quoted document
    if (quotedMsg?.documentMessage) {
      const mediaUrl = quotedMsg.documentMessage.url;
      const mimeType = quotedMsg.documentMessage.mimetype;
      if (mediaUrl && mimeType) {
        await misa.sendMessage(
          from,
          {
            document: { url: mediaUrl },
            mimetype: mimeType,
            caption: caption || quotedMsg.documentMessage.caption || "",
            mentions,
          },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 6. Direct image in command
    if (msg?.imageMessage) {
      const mediaUrl = msg.imageMessage.url;
      if (mediaUrl) {
        await misa.sendMessage(
          from,
          {
            image: { url: mediaUrl },
            caption: caption || msg.imageMessage.caption || "",
            mentions,
          },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 7. Direct video in command
    if (msg?.videoMessage) {
      const mediaUrl = msg.videoMessage.url;
      if (mediaUrl) {
        await misa.sendMessage(
          from,
          {
            video: { url: mediaUrl },
            caption: caption || msg.videoMessage.caption || "",
            mentions,
          },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 8. Direct sticker in command
    if (msg?.stickerMessage) {
      const mediaUrl = msg.stickerMessage.url;
      if (mediaUrl) {
        await misa.sendMessage(
          from,
          { sticker: { url: mediaUrl }, mentions },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 9. Direct audio in command
    if (msg?.audioMessage) {
      const mediaUrl = msg.audioMessage.url;
      if (mediaUrl) {
        await misa.sendMessage(
          from,
          { audio: { url: mediaUrl }, mentions },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 10. Direct document in command
    if (msg?.documentMessage) {
      const mediaUrl = msg.documentMessage.url;
      const mimeType = msg.documentMessage.mimetype;
      if (mediaUrl && mimeType) {
        await misa.sendMessage(
          from,
          {
            document: { url: mediaUrl },
            mimetype: mimeType,
            caption: caption || msg.documentMessage.caption || "",
            mentions,
          },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    // 11. Text-only fallback (quoted text or direct text)
    const text = caption || t("commands.hidetag.defaultMessage");
    await misa.sendMessage(from, { text, mentions }, { quoted: message as WAMessage });
  },
};

export default hidetagCommand;
