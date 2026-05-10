/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { proto } from "baileys";
import { getBotConfig, saveBotConfig } from "./config.js";
import { createConnection } from "./connection.js";
import { paths } from "./config/paths.js";
import { groupCache } from "./cache/groupCache.js";
import { toLID } from "./helpers/toLID.js";
import { isOwner } from "./helpers/isOwner.js";
import { isAdmin, isBotAdmin } from "./helpers/isAdmin.js";
import { applyAntiLink } from "./helpers/antiLink.js";
import { findSimilarCommand, sendUnknownCommandMessage } from "./helpers/unknownCommand.js";
import { CommandHandler } from "./handlers/commandHandler.js";
import { EventHandler } from "./handlers/eventHandler.js";
import { log } from "./logger.js";
import { runAutoUpdate } from "./helpers/autoUpdate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startBot(authMode: "qr" | "pairing" = "qr", phoneNumber?: string): Promise<void> {
  const config = await getBotConfig();
  const prefix = config.prefix;
  const misa = await createConnection(authMode, phoneNumber);

  const commandHandler = new CommandHandler();
  const eventHandler = new EventHandler();

  await commandHandler.loadCommands(paths.commands);
  await eventHandler.loadEvents(paths.events, misa);

  misa.ev.on("connection.update", async (update) => {
    if (update.connection === "open") {
      // Buscar e salvar o LID do dono quando conectar
      if (config.ownerNumber && !config.ownerLID) {
        log.info("OWNER", "Buscando LID do dono...");
        const ownerLID = await toLID(config.ownerNumber, misa);
        if (ownerLID) {
          config.ownerLID = ownerLID;
          await saveBotConfig(config);
          log.success("OWNER", `LID do dono salvo: ${ownerLID}`);
        } else {
          log.warn("OWNER", "Nao foi possivel obter o LID do dono.");
        }
      }
    }

    if (update.connection === "close") {
      const shouldReconnect = !String(update.lastDisconnect?.error).includes("logged out");
      if (shouldReconnect) {
        await startBot(authMode, phoneNumber);
      }
    }
  });

  misa.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const message = messages[0];
    if (!message?.message || message.key.fromMe) return;

    const from = message.key.remoteJid;
    if (!from) return;

    const isGroup = from.endsWith("@g.us");
    if (isGroup) await groupCache.ensure(from, misa);

    const rawSender = (isGroup ? message.key.participant : message.key.remoteJid) || "";
    const senderLID = rawSender ? await toLID(rawSender, misa) : null;

    if (!senderLID) {
      log.warn("COMMAND", `Ignorado porque nao foi possivel resolver LID: ${rawSender || "remetente vazio"}`);
      return;
    }

    if (isGroup && message.key.participant) message.key.participant = senderLID;
    if (message.participant) message.participant = senderLID;

    const sender = senderLID;

    const body =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      message.message.imageMessage?.caption ||
      message.message.videoMessage?.caption ||
      "";

    const isCommandMessage = body.startsWith(prefix);
    if (isGroup && !isCommandMessage) {
      const userIsOwner = await isOwner(sender);
      const userIsAdmin = userIsOwner ? true : await isAdmin(from, sender, misa);
      const botIsAdmin = await isBotAdmin(from, misa);

      if (!userIsOwner && !userIsAdmin && botIsAdmin) {
        const handled = await applyAntiLink(misa, message as proto.IWebMessageInfo, from, sender);
        if (handled) return;
      }
    }

    if (!isCommandMessage) return;

    const [rawCommandName, ...args] = body.slice(prefix.length).trim().split(/\s+/);
    const commandName = rawCommandName?.toLowerCase();

    if (!commandName) return;

    const command = commandHandler.get(commandName);
    if (!command) {
      const similar = findSimilarCommand(commandName, commandHandler.listNames());
      await sendUnknownCommandMessage(
        misa,
        from,
        sender,
        prefix,
        commandName,
        similar,
        message as proto.IWebMessageInfo,
      );
      return;
    }

    // Verificar permissões
    const userIsOwner = await isOwner(sender);

    // 1. Verificar se o comando é apenas para o dono
    if (command.ownerOnly && !userIsOwner) {
      await misa.sendMessage(from, { text: "❌ Este comando é apenas para o dono do bot." });
      return;
    }

    // 2. Verificar se o comando é apenas para grupos
    if (command.groupOnly && !isGroup) {
      await misa.sendMessage(from, { text: "❌ Este comando só pode ser usado em grupos." });
      return;
    }

    // 3. Verificar se o comando é apenas para chat privado
    if (command.privateOnly && isGroup) {
      await misa.sendMessage(from, { text: "❌ Este comando só pode ser usado no privado." });
      return;
    }

    // 4. Verificar se o comando requer admin (apenas em grupos)
    if (command.adminOnly && isGroup) {
      const userIsAdmin = await isAdmin(from, sender, misa);
      if (!userIsAdmin && !userIsOwner) {
        await misa.sendMessage(from, { text: "❌ Este comando é apenas para administradores do grupo." });
        return;
      }
    }

    // 5. Verificar se o bot precisa ser admin (apenas em grupos)
    if (command.botAdminRequired && isGroup) {
      const botIsAdmin = await isBotAdmin(from, misa);
      if (!botIsAdmin) {
        await misa.sendMessage(from, { text: "❌ Preciso ser administrador do grupo para executar este comando." });
        return;
      }
    }

    try {
      await command.execute({
        misa,
        message: message as proto.IWebMessageInfo,
        args,
        prefix,
        commandName,
        sender,
        from,
        groupCache,
        isOwner: () => isOwner(sender),
        isGroup,
        isAdmin: () => isAdmin(from, sender, misa),
        isBotAdmin: () => isBotAdmin(from, misa),
      });
    } catch (error) {
      log.error("COMMAND", `Erro ao executar ${commandName}.`, error);
      await misa.sendMessage(from, { text: "❌ Ocorreu um erro ao executar o comando." });
    }
  });

  log.success("MISA", `${config.botName} iniciada e pronta para receber mensagens.`);
}

const entryPointUrl = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (entryPointUrl) {
  const args = process.argv.slice(2);
  const authMode = args.includes("--pairing") ? "pairing" : "qr";
  const phone = args.find((a) => /^\d+$/.test(a));

  getBotConfig().then(async (config) => {
    if (config.autoUpdate && !args.includes("--no-update")) await runAutoUpdate();
    startBot(authMode, phone).catch((error) => {
      log.error("MISA", "Falha ao iniciar a bot.", error);
    });
  }).catch((error) => {
    log.error("MISA", "Falha ao iniciar a bot.", error);
  });
}
