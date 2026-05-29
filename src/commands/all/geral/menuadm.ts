/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { Command } from "../../../types/Command.js";
import { getBotConfig } from "../../../config.js";
import { sendMenu } from "../../../helpers/sendMenu.js";

const menuAdmCommand: Command = {
  name: "menuadm",
  aliases: ["madm", "menuadmin", "adminmenu"],
  description: "Mostra os comandos de administração",
  category: "geral",
  groupOnly: true,
  adminOnly: true,
  async execute({ misa, message, from, prefix, t }) {
    const config = await getBotConfig();

    await sendMenu(
      misa,
      from,
      [
        t("commands.menu.mainTitle", { botName: config.botName }),
        "│",
        `├ 〔 ${t("commands.menu.categories.grupo")} 〕`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.gp")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.kick")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.promote")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.demote")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.nomegp")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.descgp")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.hidetag")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.del")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.soadmin")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.modobn")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.setprefixgp")}`,
        "│",
        `├ 〔 ${t("commands.menu.categories.activations")} 〕`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.antilink")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.antilinkgp")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.antilinkch")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.antiloc")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.antiaudio")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.antifoto")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.antivideo")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.antidoc")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.antilista")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.bemvindo")}`,
        "│",
        `├ 〔 ${t("commands.menu.categories.welcome")} 〕`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.legendabv")}`,
        `│  ♡ ${prefix}${t("commands.menu.cmds.midiabv")}`,
        "│",
        "‧₊˚ ────────────────˚₊‧",
      ].join("\n"),
      message as WAMessage,
    );
  },
};

export default menuAdmCommand;
