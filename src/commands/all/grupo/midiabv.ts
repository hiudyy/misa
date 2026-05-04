/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage, downloadMediaMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "../../../config/paths.js";

const MAX_VIDEO_SECONDS = 15;

const midiabvCommand: Command = {
  name: "midiabv",
  aliases: ["fotobv", "videobv"],
  description: "Define ou remove a mídia de bem-vindo (imagem ou vídeo até 15s)",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ misa, message, from, args }) {
    if (args[0]?.toLowerCase() === "off") {
      const current = await getGroup(from);
      await saveGroup(from, { bemvindo: { ...current.bemvindo, midia: null } });
      await misa.sendMessage(from, { text: "✅ Mídia de bem-vindo removida." }, { quoted: message as WAMessage });
      return;
    }

    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = message.message?.imageMessage ?? quoted?.imageMessage ?? null;
    const videoMsg = message.message?.videoMessage ?? quoted?.videoMessage ?? null;

    if (!imageMsg && !videoMsg) {
      const config = await getGroup(from);
      const midiaStatus = config.bemvindo.midia
        ? `${config.bemvindo.midia.tipo === "video" ? "Vídeo 🎥" : "Imagem 🖼️"} ✅`
        : "Sem mídia ❌";
      await misa.sendMessage(
        from,
        {
          text: [
            "╭─「 *MÍDIA BV* 」",
            "│",
            `│ ✦ Status: ${midiaStatus}`,
            "│",
            "│ Envie ou responda uma imagem ou vídeo.",
            "│ Vídeos: máximo 15 segundos (enviado como gif).",
            "│ Para remover: midiabv off",
            "│",
            "╰─",
          ].join("\n"),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    // Valida duração do vídeo
    if (videoMsg) {
      const segundos = videoMsg.seconds ?? 0;
      if (segundos > MAX_VIDEO_SECONDS) {
        await misa.sendMessage(
          from,
          { text: `❌ O vídeo tem ${segundos}s. Máximo permitido: ${MAX_VIDEO_SECONDS}s.` },
          { quoted: message as WAMessage },
        );
        return;
      }
    }

    const tipo = videoMsg ? "video" : "imagem";
    const ext = videoMsg ? "mp4" : "jpg";

    const msgToDownload = (imageMsg ? message.message?.imageMessage : message.message?.videoMessage)
      ? message
      : { key: message.key, message: quoted! };

    const buffer = await downloadMediaMessage(
      msgToDownload as Parameters<typeof downloadMediaMessage>[0],
      "buffer",
      {},
    ) as Buffer;

    await fs.mkdir(paths.fotos, { recursive: true });

    const groupId = from.replace("@g.us", "");
    const filePath = path.join(paths.fotos, `welcome_${groupId}.${ext}`);
    await fs.writeFile(filePath, buffer);

    const current = await getGroup(from);
    await saveGroup(from, { bemvindo: { ...current.bemvindo, midia: { tipo, path: filePath } } });

    await misa.sendMessage(
      from,
      { text: `✅ ${tipo === "video" ? "Vídeo" : "Foto"} de bem-vindo configurado!` },
      { quoted: message as WAMessage },
    );
  },
};

export default midiabvCommand;
