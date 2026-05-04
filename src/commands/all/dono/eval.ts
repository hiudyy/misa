/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";

const evalCommand: Command = {
  name: "eval",
  aliases: ["ev", "exec"],
  description: "Executa código JavaScript (PERIGOSO - apenas dono)",
  category: "all",
  ownerOnly: true,
  async execute({ misa, message, from, args }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: "❌ Uso: eval <código>" },
        { quoted: message as WAMessage },
      );
      return;
    }

    const code = args.join(" ");

    try {
      // eslint-disable-next-line no-eval
      const result = await eval(code);
      const output = typeof result === "object" ? JSON.stringify(result, null, 2) : String(result);

      await misa.sendMessage(
        from,
        {
          text: [
            "╭─「 *EVAL RESULT* 」",
            "│",
            `│ ✦ Código: ${code}`,
            "│",
            "├─「 *OUTPUT* 」",
            "│",
            ...output.split("\n").map((line) => `│ ${line}`),
            "│",
            "╰─ Executado com sucesso.",
          ].join("\n"),
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: [
            "╭─「 *EVAL ERROR* 」",
            "│",
            `│ ✦ Código: ${code}`,
            "│",
            "├─「 *ERROR* 」",
            "│",
            `│ ${String(error)}`,
            "│",
            "╰─ Erro na execução.",
          ].join("\n"),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default evalCommand;
