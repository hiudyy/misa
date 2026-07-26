/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { WASocket } from "baileys";
import { MediaQueue, MediaQueueError, MediaQueueCode, mediaQueue } from "./mediaQueue.js";

type Translator = (key: string, vars?: Record<string, string>) => string;

type MediaJobContext = {
  misa: WASocket;
  from: string;
  sender: string;
  kind: string;
  t: Translator;
};

export async function runMediaJob<T>(
  context: MediaJobContext,
  action: (signal: AbortSignal) => Promise<T>,
  queue: MediaQueue = mediaQueue,
): Promise<T | undefined> {
  try {
    return await queue.run(
      {
        userId: context.sender,
        chatId: context.from,
        kind: context.kind,
        onQueued: async (position) => {
          await context.misa.sendMessage(context.from, {
            text: context.t("errors.media.queued", { position: String(position) }),
          });
        },
      },
      action,
    );
  } catch (error) {
    const code = error instanceof MediaQueueError ? error.code : error instanceof Error ? error.message : "";
    if (code === MediaQueueCode.FULL) {
      await context.misa.sendMessage(context.from, { text: context.t("errors.media.queueFull") });
      return undefined;
    }
    if (code === MediaQueueCode.TIMEOUT) {
      await context.misa.sendMessage(context.from, { text: context.t("errors.media.timeout") });
      return undefined;
    }
    if (code === MediaQueueCode.ABORTED) return undefined;
    throw error;
  }
}
