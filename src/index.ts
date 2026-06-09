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
import { getGroup } from "./database/groupDB.js";
import { toLID } from "./helpers/toLID.js";
import { isOwner } from "./helpers/isOwner.js";
import { isAdmin, isBotAdmin } from "./helpers/isAdmin.js";
import { applyAntiLink } from "./helpers/antiLink.js";
import { applyAntiStealth, countNormalGroupMessage } from "./helpers/antiStealth.js";
import { findSimilarCommand, sendUnknownCommandMessage } from "./helpers/unknownCommand.js";
import { cleanupExpiredBlockedUsers, isBlockedCommand, isBlockedUser, isGroupBanned } from "./helpers/ownerRestrictions.js";
import { applyMediaRestriction } from "./helpers/messageRestrictions.js";
import { isMessageDebugEnabled, logMessageDebug } from "./helpers/messageDebug.js";
import { getOwnerConfig } from "./ownerConfig.js";
import { CommandHandler } from "./handlers/commandHandler.js";
import { EventHandler } from "./handlers/eventHandler.js";
import { log } from "./logger.js";
import { runAutoUpdate } from "./helpers/autoUpdate.js";
import { resolveLocale, createTranslator } from "./i18n/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startBot(authMode: "qr" | "pairing" = "qr", phoneNumber?: string): Promise<void> {
  const config = await getBotConfig();
  const misa = await createConnection(authMode, phoneNumber);

  const commandHandler = new CommandHandler();
  const eventHandler = new EventHandler();

  await commandHandler.loadCommands(paths.commands);
  await eventHandler.loadEvents(paths.events, misa);

  misa.ev.on("connection.update", async (update) => {
    if (update.connection === "open") {
      const latestConfig = await getBotConfig();
      // Buscar e salvar o LID do dono quando conectar
      if (latestConfig.ownerNumber && !latestConfig.ownerLID) {
        const tGlobal = createTranslator(latestConfig.language || "pt");
        log.info("OWNER", tGlobal("logs.ownerLidFetching"));
        const ownerLID = await toLID(latestConfig.ownerNumber, misa);
        if (ownerLID) {
          latestConfig.ownerLID = ownerLID;
          await saveBotConfig(latestConfig);
          log.success("OWNER", tGlobal("logs.ownerLidSaved", { lid: ownerLID }));
        } else {
          log.warn("OWNER", tGlobal("logs.ownerLidFailed"));
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

  misa.ev.on("messages.upsert", async (event) => {
    if (isMessageDebugEnabled()) logMessageDebug(event);

    const { messages, type } = event;
    if (type !== "notify") return;

    const message = messages[0];
    if (!message || message.key.fromMe) return;

    const from = message.key.remoteJid;
    if (!from) return;
    const runtimeConfig = await getBotConfig();

    const isGroup = from.endsWith("@g.us");
    if (isGroup) await groupCache.ensure(from, misa);
    const groupConfig = isGroup ? await getGroup(from) : null;
    const prefix = groupConfig?.prefix || runtimeConfig.prefix;

    const rawSender = (isGroup ? message.key.participant : message.key.remoteJid) || "";
    const senderLID = rawSender ? await toLID(rawSender, misa) : null;

    if (!senderLID) {
      const tGlobal = createTranslator(config.language || "pt");
      log.warn("COMMAND", tGlobal("logs.commandIgnoredNoLid", { sender: rawSender || "remetente vazio" }));
      return;
    }

    if (isGroup && message.key.participant) message.key.participant = senderLID;
    if (message.participant) message.participant = senderLID;

    const sender = senderLID;
    const userIsOwner = await isOwner(sender);

    if (!message.message) {
      if (isGroup && !userIsOwner) {
        const locale = await resolveLocale(from);
        const userIsAdmin = await isAdmin(from, sender, misa);
        const botIsAdmin = await isBotAdmin(from, misa);
        if (!userIsAdmin && botIsAdmin) await applyAntiStealth(misa, message as proto.IWebMessageInfo, from, sender, locale);
      }
      return;
    }

    if (isGroup) countNormalGroupMessage(from, sender);

    await cleanupExpiredBlockedUsers();
    if (!userIsOwner && await isBlockedUser(sender)) {
      return;
    }

    if (!isGroup && !userIsOwner) {
      const ownerConfig = await getOwnerConfig();
      if (ownerConfig.antiPrivate) {
        return;
      }
    }

    if (isGroup && !userIsOwner && await isGroupBanned(from)) {
      return;
    }

    const body =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      message.message.imageMessage?.caption ||
      message.message.videoMessage?.caption ||
      "";

    const isCommandMessage = body.startsWith(prefix);
    if (isGroup) {
      const userIsAdmin = userIsOwner ? true : await isAdmin(from, sender, misa);
      const botIsAdmin = await isBotAdmin(from, misa);

      if (!userIsOwner && !userIsAdmin && botIsAdmin) {
        const locale = await resolveLocale(from);
        const blockedMedia = await applyMediaRestriction(misa, message as proto.IWebMessageInfo, from, sender, locale);
        if (blockedMedia) return;
      }

      if (!isCommandMessage && !userIsOwner && !userIsAdmin && botIsAdmin) {
        const locale = await resolveLocale(from);
        const handled = await applyAntiLink(misa, message as proto.IWebMessageInfo, from, sender, locale);
        if (handled) return;
      }
    }

    if (!isCommandMessage) return;

    const [rawCommandName, ...args] = body.slice(prefix.length).trim().split(/\s+/);
    const commandName = rawCommandName?.toLowerCase();

    if (!commandName) return;

    const command = commandHandler.get(commandName);
    const locale = await resolveLocale(from);
    const cmdTranslator = createTranslator(locale);

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
        locale
      );
      return;
    }

    // Verificar permissões
    // 1. Verificar se o comando é apenas para o dono
    if (command.ownerOnly && !userIsOwner) {
      await misa.sendMessage(from, { text: cmdTranslator("errors.ownerOnly") });
      return;
    }

    // 2. Verificar se o comando é apenas para grupos
    if (command.groupOnly && !isGroup) {
      await misa.sendMessage(from, { text: cmdTranslator("errors.groupOnly") });
      return;
    }

    // 3. Verificar se o comando é apenas para chat privado
    if (command.privateOnly && isGroup) {
      await misa.sendMessage(from, { text: cmdTranslator("errors.privateOnly") });
      return;
    }

    // 4. Verificar se o comando requer admin (apenas em grupos)
    if (command.adminOnly && isGroup) {
      const userIsAdmin = await isAdmin(from, sender, misa);
      if (!userIsAdmin && !userIsOwner) {
        await misa.sendMessage(from, { text: cmdTranslator("errors.adminOnly") });
        return;
      }
    }

    if (isGroup && groupConfig?.soadmin && !userIsOwner) {
      const userIsAdmin = await isAdmin(from, sender, misa);
      if (!userIsAdmin) {
        await misa.sendMessage(from, { text: cmdTranslator("errors.groupCommandsAdminOnly") });
        return;
      }
    }

    // 5. Verificar se o bot precisa ser admin (apenas em grupos)
    if (command.botAdminRequired && isGroup) {
      const botIsAdmin = await isBotAdmin(from, misa);
      if (!botIsAdmin) {
        await misa.sendMessage(from, { text: cmdTranslator("errors.botAdminRequired") });
        return;
      }
    }

    if (!userIsOwner && await isBlockedCommand(command.name)) {
      await misa.sendMessage(from, { text: cmdTranslator("errors.commandBlocked") });
      return;
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
        commandDirectory: commandHandler,
        locale,
        t: cmdTranslator,
      });
    } catch (error) {
      log.error("COMMAND", cmdTranslator("logs.commandError", { commandName }), error);
      await misa.sendMessage(from, { text: cmdTranslator("errors.commandExecution") });
    }
  });

  const globalLocale = await resolveLocale();
  const tGlobal = createTranslator(globalLocale);
  log.success("MISA", tGlobal("logs.botStarted", { botName: config.botName }));
}

const entryPointUrl = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (entryPointUrl) {
  const args = process.argv.slice(2);
  const authMode = args.includes("--pairing") ? "pairing" : "qr";
  const phone = args.find((a) => /^\d+$/.test(a));

  getBotConfig().then(async (config) => {
    // Definimos tGlobal provisório apenas para start do update/erros fatais fora do fluxo principal
    const tGlobal = createTranslator(config.language || "pt");
    
    if (config.autoUpdate && !args.includes("--no-update")) await runAutoUpdate();
    startBot(authMode, phone).catch((error) => {
      log.error("MISA", tGlobal("terminal.startFailed"), error);
    });
  }).catch((error) => {
    // Cannot easily access tGlobal here as it failed before getting config, so we log generic or fallback
    log.error("MISA", "Start failed. / Falha ao iniciar a bot.", error);
  });
}
