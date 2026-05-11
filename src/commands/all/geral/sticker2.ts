/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { createStickerCommand } from "./sticker.js";

const sticker2Command = createStickerCommand(
  "sticker2",
  ["s2", "fig2", "figurinha2"],
  "commands.sticker2.usage",
  false,
);

export default sticker2Command;
