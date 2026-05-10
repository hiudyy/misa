/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { GroupParticipant, ParticipantAction } from "baileys";
import { Event } from "../../types/Event.js";
import { getGroup } from "../../database/groupDB.js";
import { promises as fs } from "node:fs";
import { toLID } from "../../helpers/toLID.js";

type GroupParticipantsUpdateEvent = {
  id: string;
  author: string;
  participants: GroupParticipant[];
  action: ParticipantAction;
};

const welcomeEvent: Event<GroupParticipantsUpdateEvent> = {
  event: "group-participants.update",
  name: "welcome",
  async execute({ misa, data }) {
    if (data.action !== "add") return;

    const config = await getGroup(data.id);
    if (!config.bemvindo.ativo) return;

    let groupMeta: Awaited<ReturnType<typeof misa.groupMetadata>> | null = null;
    try {
      groupMeta = await misa.groupMetadata(data.id);
    } catch {
      groupMeta = null;
    }

    for (const participant of data.participants) {
      const lid = await toLID(participant.id, misa);
      if (!lid) continue;

      const numero = lid.split("@")[0];
      const nomeGrupo = groupMeta?.subject ?? "";
      const total = String(groupMeta?.participants.length ?? 0);
      const desc = groupMeta?.desc ?? "";

      const texto = config.bemvindo.legenda
        .replace(/@usuario/g, `@${numero}`)
        .replace(/@nome/g, numero)
        .replace(/@grupo/g, nomeGrupo)
        .replace(/@total/g, total)
        .replace(/@desc/g, desc);

      if (config.bemvindo.midia) {
        try {
          const buffer = await fs.readFile(config.bemvindo.midia.path);
          if (config.bemvindo.midia.tipo === "video") {
            await misa.sendMessage(data.id, {
              video: buffer,
              caption: texto,
              gifPlayback: true,
              mentions: [lid],
            });
          } else {
            await misa.sendMessage(data.id, {
              image: buffer,
              caption: texto,
              mentions: [lid],
            });
          }
          continue;
        } catch {
          // mídia inválida, cai no texto simples
        }
      }

      await misa.sendMessage(data.id, {
        text: texto,
        mentions: [lid],
      });
    }
  },
};

export default welcomeEvent;
