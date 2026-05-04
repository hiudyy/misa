/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getGroup, saveGroup } from "../../../database/groupDB.js";

const bemvindoCommand: Command = {
  name: "bemvindo",
  aliases: ["bv"],
  description: "Ativa ou desativa a mensagem de bem-vindo no grupo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from }) {
    const config = await getGroup(from);
    const novoEstado = !config.bemvindo.ativo;
    await saveGroup(from, { bemvindo: { ...config.bemvindo, ativo: novoEstado } });

    await misa.sendMessage(
      from,
      { text: novoEstado ? "✅ Bem-vindo *ativado* neste grupo!" : "❌ Bem-vindo *desativado* neste grupo." },
      { quoted: message as WAMessage },
    );
  },
};

export default bemvindoCommand;
