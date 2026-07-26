/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { WASocket } from "baileys";
import { MediaQueue, MediaQueueError, MediaQueueCode, mediaQueue } from "./mediaQueue.js";
import { log } from "../logger.js";

type Translator = (key: string, vars?: Record<string, string>) => string;

type MediaJobContext = {
  misa: WASocket;
  from: string;
  sender: string;
  kind: string;
  t: Translator;
};

type RunMediaJobOptions = {
  queue?: MediaQueue;
  waitForCompletion?: boolean;
};

async function handleCompletionError(context: MediaJobContext, error: unknown): Promise<void> {
  const code = error instanceof MediaQueueError ? error.code : error instanceof Error ? error.message : "";
  if (code === MediaQueueCode.TIMEOUT) {
    await context.misa.sendMessage(context.from, { text: context.t("errors.media.timeout") }).catch(() => undefined);
    return;
  }
  if (code === MediaQueueCode.ABORTED) return;
  log.error("MEDIA", `MEDIA_JOB_FAILED:${context.kind}`, error);
  await context.misa.sendMessage(context.from, { text: context.t("errors.media.failed") }).catch(() => undefined);
}

export async function runMediaJob<T>(
  context: MediaJobContext,
  action: (signal: AbortSignal) => Promise<T>,
  options: RunMediaJobOptions = {},
): Promise<T | undefined> {
  const queue = options.queue ?? mediaQueue;
  try {
    const handle = queue.enqueue(
      {
        userId: context.sender,
        chatId: context.from,
        kind: context.kind,
      },
      action,
    );
    if (handle.position !== null) {
      await context.misa.sendMessage(context.from, {
        text: context.t("errors.media.queued", { position: String(handle.position) }),
      });
    }
    const handled = handle.completion.catch(async (error) => {
      await handleCompletionError(context, error);
      return undefined;
    });
    if (options.waitForCompletion) return await handled;
    void handled;
    return undefined;
  } catch (error) {
    const code = error instanceof MediaQueueError ? error.code : error instanceof Error ? error.message : "";
    if (code === MediaQueueCode.FULL) {
      await context.misa.sendMessage(context.from, { text: context.t("errors.media.queueFull") });
      return undefined;
    }
    await handleCompletionError(context, error);
    return undefined;
  }
}
