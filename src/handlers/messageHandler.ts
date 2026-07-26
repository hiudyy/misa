/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WASocket } from "baileys";
import { isMessageDebugEnabled, logMessageDebug } from "../helpers/messageDebug.js";
import { log } from "../logger.js";
import { CommandHandler } from "./commandHandler.js";
import { processMessage } from "./messageProcessor.js";
import {
  createMessageDispatcher,
  MessageDispatcherCode,
  MessageDispatcherError,
} from "./messageDispatcher.js";
import { metrics } from "../metrics.js";

type MessageProcessor = typeof processMessage;

export type MessageHandlerControl = {
  dispose: () => void;
  drain: (timeoutMs?: number) => Promise<void>;
};

export function setupMessageHandler(
  misa: WASocket,
  commandHandler: CommandHandler,
  processor: MessageProcessor = processMessage,
): MessageHandlerControl {
  const dispatcher = createMessageDispatcher((snapshot) => {
    metrics.setMessageDispatch(snapshot.active, snapshot.pending);
  });
  metrics.setMessageDispatch(0, 0);
  let lastBacklogLogAt = 0;

  const logBacklog = (code: string, chatId: string) => {
    const now = Date.now();
    if (now - lastBacklogLogAt < 5_000) return;
    lastBacklogLogAt = now;
    log.warn("MESSAGE", `${code}:${chatId}`);
  };

  const listener = (event: Parameters<Parameters<typeof misa.ev.on<"messages.upsert">>[1]>[0]) => {
    if (isMessageDebugEnabled()) logMessageDebug(event);
    if (event.type !== "notify") return;

    for (const message of event.messages) {
      const chatId = message.key.remoteJid;
      if (!chatId) continue;
      metrics.recordMessage("received");

      const pendingBefore = dispatcher.snapshot().pending;
      void dispatcher.submit(async () => {
        try {
          await processor(misa, commandHandler, message);
          metrics.recordMessage("processed");
        } catch (error) {
          metrics.recordMessage("failed");
          const messageId = message.key.id ?? "unknown";
          const sender = message.key.participant ?? chatId;
          log.error("MESSAGE", `MESSAGE_PROCESSING_FAILED:${messageId}:${chatId}:${sender}`, error);
        }
      }).catch((error) => {
        if (error instanceof MessageDispatcherError && error.code === MessageDispatcherCode.STOPPED) return;
        if (error instanceof MessageDispatcherError && error.code === MessageDispatcherCode.FULL) {
          metrics.recordMessage("dropped");
          logBacklog(error.code, chatId);
          return;
        }
        if (error instanceof MessageDispatcherError && error.code === MessageDispatcherCode.TIMEOUT) {
          metrics.recordMessage("timedOut");
          logBacklog(error.code, chatId);
          return;
        }
        log.error("MESSAGE", `MESSAGE_DISPATCH_FAILED:${chatId}`, error);
      });
      if (dispatcher.snapshot().pending > pendingBefore) metrics.recordMessage("queued");
    }
  };

  misa.ev.on("messages.upsert", listener);

  return {
    dispose() {
      dispatcher.stop({ cancelPending: true });
      misa.ev.off("messages.upsert", listener);
    },
    drain: (timeoutMs) => dispatcher.drain(timeoutMs),
  };
}
