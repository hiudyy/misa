/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendMenu } from "../../../helpers/sendMenu.js";
import {
  FEMALE_PERCENT_TRAITS,
  FEMALE_RANK_TRAITS,
  INTERACTION_ACTIONS,
  MALE_PERCENT_TRAITS,
  MALE_RANK_TRAITS,
} from "../../../helpers/funGames.js";

function formatCmdList(prefix: string, names: string[]): string {
  return names.map((name) => `│  ♡ ${prefix}${name}`).join("\n");
}

const menuBrincadeiraCommand: Command = {
  name: "menubrincadeira",
  aliases: ["menubn", "menufun", "funmenu", "menujogos"],
  i18nAliases: {
    en: ["funmenu", "gamesmenu"],
    es: ["menudiversion", "menujuegos"],
  },
  description: "Shows fun/game commands (requires fun mode)",
  category: "geral",
  groupOnly: true,
  async execute({ misa, message, from, prefix, t }) {
    const config = await getBotConfig();

    const malePercent = MALE_PERCENT_TRAITS.map((trait) => trait.name);
    const femalePercent = FEMALE_PERCENT_TRAITS.map((trait) => trait.name);
    const maleRanks = MALE_RANK_TRAITS.map((trait) => trait.name);
    const femaleRanks = FEMALE_RANK_TRAITS.map((trait) => trait.name);
    const interactions = INTERACTION_ACTIONS.map((trait) => trait.name);

    await sendMenu(
      misa,
      from,
      [
        t("commands.menu.mainTitle", { botName: config.botName }),
        "│",
        t("commands.fun.menuHint"),
        "│",
        `├ 〔 ${t("commands.menu.categories.funInteractions")} 〕`,
        formatCmdList(prefix, interactions),
        "│",
        `├ 〔 ${t("commands.menu.categories.funMalePercent")} 〕`,
        formatCmdList(prefix, malePercent),
        "│",
        `├ 〔 ${t("commands.menu.categories.funFemalePercent")} 〕`,
        formatCmdList(prefix, femalePercent),
        "│",
        `├ 〔 ${t("commands.menu.categories.funMaleRank")} 〕`,
        formatCmdList(prefix, maleRanks),
        "│",
        `├ 〔 ${t("commands.menu.categories.funFemaleRank")} 〕`,
        formatCmdList(prefix, femaleRanks),
        "│",
        "‧₊˚ ────────────────˚₊‧",
      ].join("\n"),
      message as WAMessage,
    );
  },
};

export default menuBrincadeiraCommand;
