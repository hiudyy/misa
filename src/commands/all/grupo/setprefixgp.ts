import { WAMessage } from "baileys";
import { getGroup, saveGroup } from "../../../database/groupDB.js";
import { getBotConfig } from "../../../config.js";
import { Command } from "../../../types/Command.js";

const setprefixgpCommand: Command = {
  name: "setprefixgp",
  aliases: ["prefixogp", "groupprefix"],
  i18nAliases: {
    en: ["setgroupprefix", "groupprefix"],
    es: ["prefijogrupo", "setprefijogrupo"],
    id: ["prefiksgrup", "setprefiksgrup"],
  },
  description: "Define um prefixo exclusivo para o grupo",
  category: "grupo",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from, args, t }) {
    const groupConfig = await getGroup(from);
    const globalConfig = await getBotConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.setprefixgp.current", {
            value: groupConfig.prefix || globalConfig.prefix,
            global: globalConfig.prefix,
          }),
        },
        { quoted: message as WAMessage },
      );
      return;
    }

    const value = args[0]?.trim() || "";
    if (value === "reset" || value === "off") {
      await saveGroup(from, { prefix: undefined });
      await misa.sendMessage(
        from,
        { text: t("commands.setprefixgp.reset", { value: globalConfig.prefix }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    if (!value || value.length > 5 || /\s/.test(value)) {
      await misa.sendMessage(from, { text: t("commands.setprefixgp.invalid") }, { quoted: message as WAMessage });
      return;
    }

    await saveGroup(from, { prefix: value });
    await misa.sendMessage(
      from,
      { text: t("commands.setprefixgp.updated", { value }) },
      { quoted: message as WAMessage },
    );
  },
};

export default setprefixgpCommand;
