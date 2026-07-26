/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getBotConfig, updateBotConfig } from "./config.js";
import { createConnection } from "./connection.js";
import { paths } from "./config/paths.js";
import { groupCache } from "./cache/groupCache.js";
import { lidCache } from "./cache/lidCache.js";
import { toLID } from "./helpers/toLID.js";
import { getDisconnectStatusCode, shouldReconnectFromStatus } from "./helpers/reconnect.js";
import { CommandHandler } from "./handlers/commandHandler.js";
import { EventHandler } from "./handlers/eventHandler.js";
import { setupMessageHandler } from "./handlers/messageHandler.js";
import { log } from "./logger.js";
import { runAutoUpdate } from "./helpers/autoUpdate.js";
import { resolveLocale, createTranslator } from "./i18n/index.js";
import { requestShutdown, setShutdownHandler } from "./lifecycle.js";
import { drainJsonWrites } from "./storage/jsonStore.js";
import { metrics } from "./metrics.js";
import { mediaQueue } from "./media/mediaQueue.js";
import { flushGroupActivity } from "./helpers/groupActivity.js";
import { applyOperationalConfig } from "./config/runtime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 60000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

async function runBotCycle(
  authMode: "qr" | "pairing" = "qr",
  phoneNumber?: string,
  onConnected?: () => void,
  signal?: AbortSignal,
): Promise<boolean> {
  const config = await getBotConfig();
  const commandHandler = new CommandHandler();
  await commandHandler.loadCommands(paths.commands);
  if (signal?.aborted) return false;

  const misa = await createConnection(authMode, phoneNumber);
  const eventHandler = new EventHandler();
  groupCache.clear();
  const disposeGroupCache = groupCache.registerEvents(misa);
  const disposeEvents = await eventHandler.loadEvents(paths.events, misa);

  const messageControl = setupMessageHandler(misa, commandHandler);

  const globalLocale = await resolveLocale();
  const tGlobal = createTranslator(globalLocale);
  log.success(config.botName, tGlobal("logs.botStarted", { botName: config.botName }));

  return new Promise<boolean>((resolve) => {
    let settled = false;

    const settle = async (shouldReconnect: boolean, closeSocket = false) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      misa.ev.off("connection.update", onConnectionUpdate);
      mediaQueue.cancelAll();
      messageControl.dispose();
      disposeEvents();
      disposeGroupCache();

      await messageControl.drain().catch((error) => log.error("BOT", "MESSAGE_DRAIN_FAILED", error));
      await flushGroupActivity().catch((error) => log.error("BOT", "ACTIVITY_FLUSH_FAILED", error));
      await lidCache.flush().catch((error) => log.error("BOT", "LID_CACHE_FLUSH_FAILED", error));
      await drainJsonWrites().catch((error) => log.error("BOT", "JSON_DRAIN_FAILED", error));
      if (closeSocket) await misa.end(undefined).catch((error) => log.error("BOT", "SOCKET_CLOSE_FAILED", error));
      resolve(shouldReconnect);
    };

    const onAbort = () => void settle(false, true);
    const onConnectionUpdate: Parameters<Parameters<typeof misa.ev.on<"connection.update">>[1]>[0] extends infer T
      ? (update: T) => Promise<void>
      : never = async (update) => {
      if (update.connection === "open") {
        onConnected?.();
        try {
          const latestConfig = await getBotConfig();
          if (latestConfig.ownerNumber && !latestConfig.ownerLID) {
            const tOwner = createTranslator(latestConfig.language || "pt");
            log.info("OWNER", tOwner("logs.ownerLidFetching"));
            const ownerLID = await toLID(latestConfig.ownerNumber, misa);
            if (ownerLID) {
              await updateBotConfig((current) => ({ ...current, ownerLID }));
              log.success("OWNER", tOwner("logs.ownerLidSaved", { lid: ownerLID }));
            } else {
              log.warn("OWNER", tOwner("logs.ownerLidFailed"));
            }
          }
        } catch (error) {
          log.error("OWNER", "OWNER_LID_UPDATE_FAILED", error);
        }
      }

      if (update.connection === "close") {
        const statusCode = getDisconnectStatusCode(update.lastDisconnect?.error);
        await settle(shouldReconnectFromStatus(statusCode));
      }
    };

    misa.ev.on("connection.update", onConnectionUpdate);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

export async function startBot(authMode: "qr" | "pairing" = "qr", phoneNumber?: string): Promise<void> {
  let attempt = 0;
  const config = await getBotConfig();
  applyOperationalConfig(config.operations);
  const tGlobal = createTranslator(config.language || "pt");
  const controller = new AbortController();
  const onSigint = () => requestShutdown("sigint");
  const onSigterm = () => requestShutdown("sigterm");

  setShutdownHandler((reason) => controller.abort(reason));
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);

  try {
    while (!controller.signal.aborted && attempt < MAX_RECONNECT_ATTEMPTS) {
      const shouldReconnect = await runBotCycle(authMode, phoneNumber, () => {
        attempt = 0;
      }, controller.signal);

      if (controller.signal.aborted) return;
      if (!shouldReconnect) {
        log.info("BOT", tGlobal("connection.noAutoReconnect"));
        return;
      }

      attempt += 1;
      metrics.recordReconnect();
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
      await sleep(delay, controller.signal);
    }

    if (!controller.signal.aborted) {
      log.error("BOT", tGlobal("connection.maxReconnectReached", { max: String(MAX_RECONNECT_ATTEMPTS) }));
    }
  } finally {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
    setShutdownHandler(null);
    await flushGroupActivity().catch((error) => log.error("BOT", "ACTIVITY_FLUSH_FAILED", error));
    await lidCache.flush().catch((error) => log.error("BOT", "LID_CACHE_FLUSH_FAILED", error));
    await drainJsonWrites().catch((error) => log.error("BOT", "JSON_DRAIN_FAILED", error));
  }
}

const entryPointUrl = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (entryPointUrl) {
  const args = process.argv.slice(2);
  const authMode = args.includes("--pairing") ? "pairing" : "qr";
  const phone = args.find((a) => /^\d+$/.test(a));

  let tGlobal = createTranslator("pt");
  let botScope = "Misa";

  getBotConfig().then(async (config) => {
    applyOperationalConfig(config.operations);
    tGlobal = createTranslator(config.language || "pt");
    botScope = config.botName;

    if (config.autoUpdate && !args.includes("--no-update")) {
      await runAutoUpdate({ maxBackups: config.operations.updates.maxBackups });
    }
    startBot(authMode, phone).catch((error) => {
      log.error(botScope, tGlobal("terminal.startFailed"), error);
    });
  }).catch((error) => {
    log.error(botScope, tGlobal("terminal.startFailed"), error);
  });
}
