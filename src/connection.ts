/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from "baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { getBotConfig } from "./config.js";
import { paths } from "./config/paths.js";
import { groupCache } from "./cache/groupCache.js";
import { log } from "./logger.js";
import { hasValidSession } from "./helpers/hasValidSession.js";
import { getGlobalLocale, createTranslator } from "./i18n/index.js";

const logger = pino({ level: "silent" });

type DisconnectInfo = {
  title: string;
  description: string;
  action: string;
  shouldReconnect: boolean;
};

function getDisconnectInfo(statusCode: number | undefined, t: any): DisconnectInfo {
  switch (statusCode) {
    case DisconnectReason.loggedOut:
      return {
        title: t("connection.disconnect.loggedOut.title"),
        description: t("connection.disconnect.loggedOut.description"),
        action: t("connection.disconnect.loggedOut.action"),
        shouldReconnect: false,
      };
    case DisconnectReason.forbidden:
      return {
        title: t("connection.disconnect.forbidden.title"),
        description: t("connection.disconnect.forbidden.description"),
        action: t("connection.disconnect.forbidden.action"),
        shouldReconnect: false,
      };
    case DisconnectReason.connectionLost:
      return {
        title: t("connection.disconnect.connectionLost.title"),
        description: t("connection.disconnect.connectionLost.description"),
        action: t("connection.disconnect.connectionLost.action"),
        shouldReconnect: true,
      };
    case DisconnectReason.multideviceMismatch:
      return {
        title: t("connection.disconnect.multideviceMismatch.title"),
        description: t("connection.disconnect.multideviceMismatch.description"),
        action: t("connection.disconnect.multideviceMismatch.action"),
        shouldReconnect: false,
      };
    case DisconnectReason.connectionClosed:
      return {
        title: t("connection.disconnect.connectionClosed.title"),
        description: t("connection.disconnect.connectionClosed.description"),
        action: t("connection.disconnect.connectionClosed.action"),
        shouldReconnect: true,
      };
    case DisconnectReason.connectionReplaced:
      return {
        title: t("connection.disconnect.connectionReplaced.title"),
        description: t("connection.disconnect.connectionReplaced.description"),
        action: t("connection.disconnect.connectionReplaced.action"),
        shouldReconnect: false,
      };
    case DisconnectReason.badSession:
      return {
        title: t("connection.disconnect.badSession.title"),
        description: t("connection.disconnect.badSession.description"),
        action: t("connection.disconnect.badSession.action", { authPath: paths.auth }),
        shouldReconnect: false,
      };
    case DisconnectReason.unavailableService:
      return {
        title: t("connection.disconnect.unavailableService.title"),
        description: t("connection.disconnect.unavailableService.description"),
        action: t("connection.disconnect.unavailableService.action"),
        shouldReconnect: true,
      };
    case DisconnectReason.restartRequired:
      return {
        title: t("connection.disconnect.restartRequired.title"),
        description: t("connection.disconnect.restartRequired.description"),
        action: t("connection.disconnect.restartRequired.action"),
        shouldReconnect: true,
      };
    default:
      return {
        title: t("connection.disconnect.default.title"),
        description: t("connection.disconnect.default.description"),
        action: t("connection.disconnect.default.action"),
        shouldReconnect: true,
      };
  }
}

function logDisconnect(statusCode: number | undefined, t: any): boolean {
  const info = getDisconnectInfo(statusCode, t);
  const status = statusCode ?? t("common.unknown");

  log.box(
    "CONNECTION",
    t("connection.disconnected"),
    [
      t("connection.disconnectCode", { code: String(status) }),
      t("connection.disconnectReason", { reason: info.title }),
      t("connection.disconnectDetail", { detail: info.description }),
      t("connection.disconnectAction", { action: info.action }),
    ],
    info.shouldReconnect ? "yellow" : "red",
  );

  return info.shouldReconnect;
}

async function clearAuthSession(t: any): Promise<void> {
  try {
    await fs.rm(paths.auth, { force: true, recursive: true });
    log.success("CONNECTION", t("connection.sessionCleared"));
  } catch (error) {
    log.error("CONNECTION", t("connection.sessionClearFailed", { path: paths.auth }), error);
  }
}

function trimQrMargin(qrOutput: string): string {
  const lines = qrOutput.split(/\r?\n/);
  const top = lines.findIndex((line) => line.trim().length > 0);

  if (top === -1) return qrOutput;

  let bottom = lines.length - 1;
  while (bottom > top && lines[bottom].trim().length === 0) {
    bottom -= 1;
  }

  const content = lines.slice(top, bottom + 1);
  const bounds = content.reduce(
    (acc, line) => {
      const first = line.search(/\S/);
      if (first === -1) return acc;

      return {
        left: Math.min(acc.left, Math.max(0, first - 1)),
        right: Math.max(acc.right, line.length),
      };
    },
    { left: Number.POSITIVE_INFINITY, right: 0 },
  );

  if (!Number.isFinite(bounds.left)) return qrOutput;

  return content.map((line) => line.slice(bounds.left, bounds.right)).join("\n");
}

function printCompactQr(qr: string): void {
  qrcode.generate(qr, { small: true }, (output) => {
    console.log(trimQrMargin(output));
  });
}

export async function createConnection(authMode: "qr" | "pairing" = "qr", phoneNumber?: string): Promise<WASocket> {
  const globalLocale = await getGlobalLocale();
  const t = createTranslator(globalLocale);
  const config = await getBotConfig();

  const { state, saveCreds } = await useMultiFileAuthState(paths.auth);
  const { version } = await fetchLatestBaileysVersion();

  // Verifica se já existe uma sessão válida
  const hasSession = await hasValidSession();
  if (hasSession) {
    log.info("CONNECTION", t("connection.sessionDetected"));
  }

  const misa = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.ubuntu(config.botName),
  });

  misa.ev.on("creds.update", saveCreds);
  groupCache.registerEvents(misa);

  let pairingRequested = false;

  misa.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Se já tem sessão válida, não exibe QR/Pairing
      if (hasSession) {
        return;
      }

      if (authMode === "pairing" && !pairingRequested && phoneNumber) {
        pairingRequested = true;
        misa.requestPairingCode(phoneNumber).then((code) => {
          log.box("PAIRING", t("connection.pairingCode"), [t("connection.pairingCodeValue", { code }), t("connection.pairingInstruction")], "magenta");
        }).catch((error) => {
          log.error("PAIRING", t("connection.pairingError"), error);
        });
        return;
      }

      // Só exibe QR se o modo for QR
      if (authMode === "qr") {
        log.box("QR", t("connection.qrReceived"), [t("connection.qrScan")], "magenta");
        printCompactQr(qr);
      } else if (authMode === "pairing") {
        // Se já solicitou pairing, apenas informa que o código expirou
        if (pairingRequested) {
          log.warn("PAIRING", t("connection.pairingExpired"));
          if (phoneNumber) {
            misa.requestPairingCode(phoneNumber).then((code) => {
              log.box("PAIRING", t("connection.pairingNewCode"), [t("connection.pairingCodeValue", { code }), t("connection.pairingInstruction")], "magenta");
            }).catch((error) => {
              log.error("PAIRING", t("connection.pairingError"), error);
            });
          }
        }
      }
    }

    if (connection === "connecting") {
      log.info("CONNECTION", t("connection.connecting"));
    }

    if (connection === "open") {
      log.success("CONNECTION", t("connection.connected"));
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
      const shouldReconnect = logDisconnect(statusCode, t);

      if (shouldReconnect) {
        log.info("CONNECTION", t("connection.reconnecting"));
      }

      if (statusCode === DisconnectReason.loggedOut) {
        void clearAuthSession(t);
      }
    }
  });

  return misa;
}
