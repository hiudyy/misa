/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WASocket } from "baileys";
import { isMessageDebugEnabled, logMessageDebug } from "../helpers/messageDebug.js";
import { log } from "../logger.js";
import { CommandHandler } from "./commandHandler.js";
import { processMessage } from "./messageProcessor.js";
import { MessageQueue } from "./messageQueue.js";
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
  const queue = new MessageQueue();

  const listener = (event: Parameters<Parameters<typeof misa.ev.on<"messages.upsert">>[1]>[0]) => {
    if (isMessageDebugEnabled()) logMessageDebug(event);
    if (event.type !== "notify") return;

    for (const message of event.messages) {
      const chatId = message.key.remoteJid;
      if (!chatId) continue;
      metrics.recordMessage("received");

      void queue.enqueue(chatId, async () => {
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
        if (String(error).includes("MESSAGE_QUEUE_STOPPED")) return;
        log.error("MESSAGE", `MESSAGE_QUEUE_FAILED:${chatId}`, error);
      });
    }
  };

  misa.ev.on("messages.upsert", listener);

  return {
    dispose() {
      queue.stop();
      misa.ev.off("messages.upsert", listener);
    },
    drain: (timeoutMs) => queue.drain(timeoutMs),
  };
}
