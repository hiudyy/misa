/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
export const MessageDispatcherCode = {
  STOPPED: "MESSAGE_DISPATCHER_STOPPED",
  FULL: "MESSAGE_BACKLOG_FULL",
  TIMEOUT: "MESSAGE_BACKLOG_TIMEOUT",
  DRAIN_TIMEOUT: "MESSAGE_DISPATCHER_DRAIN_TIMEOUT",
} as const;

type MessageDispatcherCodeValue = typeof MessageDispatcherCode[keyof typeof MessageDispatcherCode];

export class MessageDispatcherError extends Error {
  constructor(public readonly code: MessageDispatcherCodeValue) {
    super(code);
    this.name = "MessageDispatcherError";
  }
}

export type MessageDispatcherOptions = {
  maxConcurrent?: number;
  maxPending?: number;
  queueTimeoutMs?: number;
  onStateChange?: (snapshot: MessageDispatcherSnapshot) => void;
};

type PendingTask = {
  action: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: NodeJS.Timeout;
};

export type MessageDispatcherSnapshot = {
  active: number;
  pending: number;
  maxConcurrent: number;
  maxPending: number;
  queueTimeoutMs: number;
  accepting: boolean;
};

export class MessageDispatcher {
  private readonly maxConcurrent: number;
  private readonly maxPending: number;
  private readonly queueTimeoutMs: number;
  private readonly onStateChange?: (snapshot: MessageDispatcherSnapshot) => void;
  private readonly pending: PendingTask[] = [];
  private readonly active = new Set<PendingTask>();
  private readonly idleWaiters = new Set<() => void>();
  private accepting = true;

  constructor(options: MessageDispatcherOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 10;
    this.maxPending = options.maxPending ?? 200;
    this.queueTimeoutMs = options.queueTimeoutMs ?? 60_000;
    this.onStateChange = options.onStateChange;
    if (!Number.isInteger(this.maxConcurrent) || this.maxConcurrent < 1) throw new Error("MESSAGE_CONCURRENCY_INVALID");
    if (!Number.isInteger(this.maxPending) || this.maxPending < 0) throw new Error("MESSAGE_PENDING_INVALID");
    if (!Number.isInteger(this.queueTimeoutMs) || this.queueTimeoutMs < 1) throw new Error("MESSAGE_TIMEOUT_INVALID");
  }

  submit<T>(action: () => Promise<T>): Promise<T> {
    if (!this.accepting) return Promise.reject(new MessageDispatcherError(MessageDispatcherCode.STOPPED));
    if (this.active.size >= this.maxConcurrent && this.pending.length >= this.maxPending) {
      return Promise.reject(new MessageDispatcherError(MessageDispatcherCode.FULL));
    }

    return new Promise<T>((resolve, reject) => {
      const task: PendingTask = {
        action,
        resolve: (value) => resolve(value as T),
        reject,
        timer: setTimeout(() => this.expire(task), this.queueTimeoutMs),
      };
      task.timer.unref?.();

      if (this.active.size < this.maxConcurrent) this.start(task);
      else {
        this.pending.push(task);
        this.emitState();
      }
    });
  }

  stop(options: { cancelPending?: boolean } = {}): void {
    this.accepting = false;
    if (options.cancelPending !== false) {
      const error = new MessageDispatcherError(MessageDispatcherCode.STOPPED);
      for (const task of this.pending.splice(0)) {
        clearTimeout(task.timer);
        task.reject(error);
      }
      this.notifyIdle();
      this.emitState();
    }
  }

  async drain(timeoutMs = 10_000): Promise<void> {
    if (this.active.size === 0 && this.pending.length === 0) return;
    let timer: NodeJS.Timeout | undefined;
    let idleResolve!: () => void;
    const idle = new Promise<void>((resolve) => {
      idleResolve = resolve;
      this.idleWaiters.add(resolve);
    });
    const timeout = new Promise<void>((_, reject) => {
      timer = setTimeout(() => reject(new MessageDispatcherError(MessageDispatcherCode.DRAIN_TIMEOUT)), timeoutMs);
      timer.unref?.();
    });
    try {
      await Promise.race([idle, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
      this.idleWaiters.delete(idleResolve);
    }
  }

  snapshot(): MessageDispatcherSnapshot {
    return {
      active: this.active.size,
      pending: this.pending.length,
      maxConcurrent: this.maxConcurrent,
      maxPending: this.maxPending,
      queueTimeoutMs: this.queueTimeoutMs,
      accepting: this.accepting,
    };
  }

  private start(task: PendingTask): void {
    clearTimeout(task.timer);
    this.active.add(task);
    this.emitState();
    void Promise.resolve().then(task.action).then(
      (value) => {
        this.finish(task);
        task.resolve(value);
      },
      (error) => {
        this.finish(task);
        task.reject(error);
      },
    );
  }

  private finish(task: PendingTask): void {
    this.active.delete(task);
    const next = this.pending.shift();
    if (next) this.start(next);
    this.notifyIdle();
    this.emitState();
  }

  private expire(task: PendingTask): void {
    const index = this.pending.indexOf(task);
    if (index < 0) return;
    this.pending.splice(index, 1);
    task.reject(new MessageDispatcherError(MessageDispatcherCode.TIMEOUT));
    this.notifyIdle();
    this.emitState();
  }

  private notifyIdle(): void {
    if (this.active.size > 0 || this.pending.length > 0) return;
    for (const resolve of this.idleWaiters) resolve();
    this.idleWaiters.clear();
  }

  private emitState(): void {
    this.onStateChange?.(this.snapshot());
  }
}

let dispatcherDefaults: Required<Omit<MessageDispatcherOptions, "onStateChange">> = {
  maxConcurrent: 10,
  maxPending: 200,
  queueTimeoutMs: 60_000,
};

export function configureMessageDispatcherDefaults(options: Required<Omit<MessageDispatcherOptions, "onStateChange">>): void {
  dispatcherDefaults = { ...options };
}

export function createMessageDispatcher(onStateChange?: MessageDispatcherOptions["onStateChange"]): MessageDispatcher {
  return new MessageDispatcher({ ...dispatcherDefaults, onStateChange });
}

export function getMessageDispatcherDefaults(): Required<Omit<MessageDispatcherOptions, "onStateChange">> {
  return { ...dispatcherDefaults };
}
