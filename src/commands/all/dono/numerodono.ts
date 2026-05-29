/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig, saveBotConfig } from "../../../config.js";
import { toLID } from "../../../helpers/toLID.js";
import { Command } from "../../../types/Command.js";

const numerodonoCommand: Command = {
  name: "numerodono",
  aliases: ["ownernumber", "setownernumber"],
  description: "Atualiza o número do dono no config do bot",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    const config = await getBotConfig();

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        { text: t("commands.numerodono.current", { value: config.ownerNumber || t("common.none") }) },
        { quoted: message as WAMessage },
      );
      return;
    }

    const ownerNumber = args.join("").replace(/\D/g, "");
    if (ownerNumber.length < 7) {
      await misa.sendMessage(from, { text: t("commands.numerodono.invalid") }, { quoted: message as WAMessage });
      return;
    }

    const ownerLID = await toLID(ownerNumber, misa);
    config.ownerNumber = ownerNumber;

    if (ownerLID) {
      config.ownerLID = ownerLID;
    }

    await saveBotConfig(config);

    await misa.sendMessage(
      from,
      {
        text: ownerLID
          ? t("commands.numerodono.updated", { value: ownerNumber, lid: ownerLID })
          : t("commands.numerodono.updatedNoLid", { value: ownerNumber }),
      },
      { quoted: message as WAMessage },
    );
  },
};

export default numerodonoCommand;
