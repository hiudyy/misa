/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
export class MessageQueue {
  private readonly queues = new Map<string, Promise<unknown>>();
  private accepting = true;

  enqueue<T>(chatId: string, action: () => Promise<T>): Promise<T> {
    if (!this.accepting) return Promise.reject(new Error("MESSAGE_QUEUE_STOPPED"));

    const previous = this.queues.get(chatId) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(action);
    const tracked = current.catch(() => undefined).finally(() => {
      if (this.queues.get(chatId) === tracked) this.queues.delete(chatId);
    });
    this.queues.set(chatId, tracked);
    return current;
  }

  stop(): void {
    this.accepting = false;
  }

  async drain(timeoutMs = 10_000): Promise<void> {
    const pending = Promise.allSettled([...this.queues.values()]).then(() => undefined);
    if (this.queues.size === 0) return;

    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<void>((_, reject) => {
      timer = setTimeout(() => reject(new Error("MESSAGE_QUEUE_DRAIN_TIMEOUT")), timeoutMs);
    });

    try {
      await Promise.race([pending, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  get size(): number {
    return this.queues.size;
  }
}
