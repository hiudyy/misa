import { Command } from "../../../src/types/Command.js";

const pingCommand: Command = {
  name: "ping",
  aliases: ["pong"],
  i18nAliases: {
    en: ["latency"],
    es: ["latencia"],
  },
  description: "Ping command for tests",
  category: "test",
  async execute({ misa, from }) {
    await misa.sendMessage(from, { text: "pong" });
  },
};

export default pingCommand;
