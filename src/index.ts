/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { proto, WASocket } from "baileys";
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
import { recordGroupActivity } from "./helpers/groupActivity.js";
import { getDisconnectStatusCode, shouldReconnectFromStatus } from "./helpers/reconnect.js";
import { tryHandleApkReply } from "./helpers/apkReply.js";
import { resolveCommandPrefix } from "./helpers/resolveCommandPrefix.js";
import { getOwnerConfig } from "./ownerConfig.js";
import { CommandHandler } from "./handlers/commandHandler.js";
import { EventHandler } from "./handlers/eventHandler.js";
import { log } from "./logger.js";
import { runAutoUpdate } from "./helpers/autoUpdate.js";
import { resolveLocale, createTranslator } from "./i18n/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 60000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setupMessageHandler(
  misa: WASocket,
  commandHandler: CommandHandler,
  config: Awaited<ReturnType<typeof getBotConfig>>,
): Promise<void> {
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
    const fallbackPrefix = groupConfig?.prefix || runtimeConfig.prefix;

    const rawSender = (isGroup ? message.key.participant : message.key.remoteJid) || "";
    const senderLID = rawSender ? await toLID(rawSender, misa) : null;

    if (!senderLID) {
      const tGlobal = createTranslator(runtimeConfig.language || "pt");
      log.warn("COMMAND", tGlobal("logs.commandIgnoredNoLid", { sender: rawSender || tGlobal("logs.emptySender") }));
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

    const resolved = resolveCommandPrefix(body, runtimeConfig.prefixByLocale, fallbackPrefix);
    const prefix = resolved.prefix;
    const isCommandMessage = resolved.matched;
    if (isGroup) {
      const isStickerMessage = Boolean(message.message.stickerMessage);
      await recordGroupActivity(from, sender, isCommandMessage ? "command" : isStickerMessage ? "sticker" : "message")
        .catch((error) => log.warn("ATIVIDADE", String(error)));
    }

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

    if (!isCommandMessage) {
      const locale = await resolveLocale(from);
      const sessionT = createTranslator(locale);
      await tryHandleApkReply({
        misa,
        from,
        sender,
        body,
        message: message as proto.IWebMessageInfo,
        t: sessionT,
      });
      return;
    }

    const [rawCommandName, ...args] = body.slice(prefix.length).trim().split(/\s+/);
    const commandName = rawCommandName?.toLowerCase();

    if (!commandName) return;

    const command = commandHandler.get(commandName);
    const locale = resolved.locale ?? (await resolveLocale(from));
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
}

async function runBotCycle(
  authMode: "qr" | "pairing" = "qr",
  phoneNumber?: string,
  onConnected?: () => void,
): Promise<boolean> {
  const config = await getBotConfig();
  const misa = await createConnection(authMode, phoneNumber);

  const commandHandler = new CommandHandler();
  const eventHandler = new EventHandler();

  await commandHandler.loadCommands(paths.commands);
  await eventHandler.loadEvents(paths.events, misa);

  setupMessageHandler(misa, commandHandler, config);

  const globalLocale = await resolveLocale();
  const tGlobal = createTranslator(globalLocale);
  log.success(config.botName, tGlobal("logs.botStarted", { botName: config.botName }));

  return new Promise<boolean>((resolve) => {
    let settled = false;

    const settle = (shouldReconnect: boolean) => {
      if (settled) return;
      settled = true;
      resolve(shouldReconnect);
    };

    misa.ev.on("connection.update", async (update) => {
      if (update.connection === "open") {
        onConnected?.();
        const latestConfig = await getBotConfig();
        // Buscar e salvar o LID do dono quando conectar
        if (latestConfig.ownerNumber && !latestConfig.ownerLID) {
          const tOwner = createTranslator(latestConfig.language || "pt");
          log.info("OWNER", tOwner("logs.ownerLidFetching"));
          const ownerLID = await toLID(latestConfig.ownerNumber, misa);
          if (ownerLID) {
            latestConfig.ownerLID = ownerLID;
            await saveBotConfig(latestConfig);
            log.success("OWNER", tOwner("logs.ownerLidSaved", { lid: ownerLID }));
          } else {
            log.warn("OWNER", tOwner("logs.ownerLidFailed"));
          }
        }
      }

      if (update.connection === "close") {
        const statusCode = getDisconnectStatusCode(update.lastDisconnect?.error);
        settle(shouldReconnectFromStatus(statusCode));
      }
    });
  });
}

export async function startBot(authMode: "qr" | "pairing" = "qr", phoneNumber?: string): Promise<void> {
  let attempt = 0;
  const config = await getBotConfig();
  const tGlobal = createTranslator(config.language || "pt");

  while (attempt < MAX_RECONNECT_ATTEMPTS) {
    const shouldReconnect = await runBotCycle(authMode, phoneNumber, () => {
      // Conexão estável: zera o backoff para quedas futuras ao longo do tempo
      attempt = 0;
    });

    if (!shouldReconnect) {
      log.info("BOT", tGlobal("connection.noAutoReconnect"));
      return;
    }

    attempt += 1;
    if (attempt >= MAX_RECONNECT_ATTEMPTS) break;

    const delay = Math.min(INITIAL_RECONNECT_DELAY_MS * 2 ** (attempt - 1), MAX_RECONNECT_DELAY_MS);
    log.warn(
      "BOT",
      tGlobal("connection.reconnectAttempt", {
        delay: String(delay),
        attempt: String(attempt),
        max: String(MAX_RECONNECT_ATTEMPTS),
      }),
    );
    await sleep(delay);
  }

  log.error("BOT", tGlobal("connection.maxReconnectReached", { max: String(MAX_RECONNECT_ATTEMPTS) }));
}

const entryPointUrl = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (entryPointUrl) {
  const args = process.argv.slice(2);
  const authMode = args.includes("--pairing") ? "pairing" : "qr";
  const phone = args.find((a) => /^\d+$/.test(a));

  let tGlobal = createTranslator("pt");
  let botScope = "Misa";

  getBotConfig().then(async (config) => {
    tGlobal = createTranslator(config.language || "pt");
    botScope = config.botName;

    if (config.autoUpdate && !args.includes("--no-update")) await runAutoUpdate();
    startBot(authMode, phone).catch((error) => {
      log.error(botScope, tGlobal("terminal.startFailed"), error);
    });
  }).catch((error) => {
    log.error(botScope, tGlobal("terminal.startFailed"), error);
  });
}
