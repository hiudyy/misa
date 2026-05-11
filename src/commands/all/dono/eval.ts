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
  async execute({ misa, message, from, args, t }) {
    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.eval.noArgs") },
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
          text: t("commands.eval.success", { code, output: output.split("\n").map((line) => `│ ${line}`).join("\n") }),
        },
        { quoted: message as WAMessage },
      );
    } catch (error) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.eval.error", { code, error: String(error) }),
        },
        { quoted: message as WAMessage },
      );
    }
  },
};

export default evalCommand;
