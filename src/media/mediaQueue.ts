/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { randomUUID } from "node:crypto";
import { metrics } from "../metrics.js";

export const MediaQueueCode = {
  FULL: "MEDIA_QUEUE_FULL",
  TIMEOUT: "MEDIA_QUEUE_TIMEOUT",
  ABORTED: "MEDIA_ABORTED",
} as const;

export class MediaQueueError extends Error {
  constructor(public readonly code: typeof MediaQueueCode[keyof typeof MediaQueueCode]) {
    super(code);
    this.name = "MediaQueueError";
  }
}

type QueueOptions = {
  maxActive?: number;
  maxPending?: number;
  timeoutMs?: number;
  now?: () => number;
};

type RunOptions = {
  userId: string;
  chatId: string;
  kind: string;
  onQueued?: (position: number) => void | Promise<void>;
};

type PendingJob = {
  id: string;
  userId: string;
  chatId: string;
  kind: string;
  enqueuedAt: number;
  controller: AbortController;
  task: (signal: AbortSignal) => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: NodeJS.Timeout;
  started: boolean;
  terminalError?: MediaQueueError;
};

export type MediaQueueSnapshot = {
  active: number;
  pending: number;
  maxActive: number;
  maxPending: number;
  timeoutMs: number;
};

export type MediaJobHandle<T> = {
  completion: Promise<T>;
  startedImmediately: boolean;
  position: number | null;
};

export class MediaQueue {
  private readonly maxActive: number;
  private readonly maxPending: number;
  private readonly timeoutMs: number;
  private readonly now: () => number;
  private readonly pending: PendingJob[] = [];
  private readonly active = new Map<string, PendingJob>();
  private readonly activeUsers = new Set<string>();

  constructor(options: QueueOptions = {}) {
    this.maxActive = options.maxActive ?? 2;
    this.maxPending = options.maxPending ?? 20;
    this.timeoutMs = options.timeoutMs ?? 5 * 60_000;
    this.now = options.now ?? Date.now;
  }

  enqueue<T>(options: RunOptions, task: (signal: AbortSignal) => Promise<T>): MediaJobHandle<T> {
    const canStart = this.active.size < this.maxActive && !this.activeUsers.has(options.userId);
    if (!canStart && this.pending.length >= this.maxPending) {
      metrics.recordMediaEvent("rejected");
      throw new MediaQueueError(MediaQueueCode.FULL);
    }

    let position: number | null = null;
    const completion = new Promise<T>((resolve, reject) => {
      const controller = new AbortController();
      const job: PendingJob = {
        id: randomUUID(),
        userId: options.userId,
        chatId: options.chatId,
        kind: options.kind,
        enqueuedAt: this.now(),
        controller,
        task,
        resolve: (value) => resolve(value as T),
        reject,
        started: false,
        timer: setTimeout(() => this.timeoutJob(job), this.timeoutMs),
      };

      if (canStart) {
        this.start(job);
        return;
      }

      this.pending.push(job);
      position = this.pending.length;
      metrics.recordMediaEvent("queued");
      void Promise.resolve(options.onQueued?.(position)).catch(() => undefined);
    });
    return { completion, startedImmediately: canStart, position };
  }

  run<T>(options: RunOptions, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
    try {
      return this.enqueue(options, task).completion;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  cancelAll(): void {
    for (const job of this.pending.splice(0)) {
      clearTimeout(job.timer);
      job.controller.abort(new MediaQueueError(MediaQueueCode.ABORTED));
      job.reject(new MediaQueueError(MediaQueueCode.ABORTED));
    }
    for (const job of this.active.values()) {
      const error = new MediaQueueError(MediaQueueCode.ABORTED);
      job.terminalError = error;
      job.controller.abort(error);
    }
  }

  snapshot(): MediaQueueSnapshot {
    return {
      active: this.active.size,
      pending: this.pending.length,
      maxActive: this.maxActive,
      maxPending: this.maxPending,
      timeoutMs: this.timeoutMs,
    };
  }

  private start(job: PendingJob): void {
    job.started = true;
    this.active.set(job.id, job);
    this.activeUsers.add(job.userId);
    metrics.recordMediaEvent("started");
    const startedAt = this.now();

    Promise.resolve()
      .then(() => job.task(job.controller.signal))
      .then((value) => {
        if (job.terminalError) {
          metrics.recordMedia(job.kind, "failure", this.now() - startedAt);
          job.reject(job.terminalError);
          return;
        }
        metrics.recordMedia(job.kind, "success", this.now() - startedAt);
        job.resolve(value);
      }, (error) => {
        metrics.recordMedia(job.kind, "failure", this.now() - startedAt);
        job.reject(job.terminalError ?? error);
      })
      .finally(() => {
        clearTimeout(job.timer);
        this.active.delete(job.id);
        this.activeUsers.delete(job.userId);
        this.dispatch();
      });
  }

  private dispatch(): void {
    while (this.active.size < this.maxActive) {
      const index = this.pending.findIndex((job) => !this.activeUsers.has(job.userId));
      if (index < 0) return;
      const [job] = this.pending.splice(index, 1);
      this.start(job);
    }
  }

  private timeoutJob(job: PendingJob): void {
    metrics.recordMediaEvent("timeout");
    const error = new MediaQueueError(MediaQueueCode.TIMEOUT);
    job.terminalError = error;
    job.controller.abort(error);
    if (job.started) return;

    const index = this.pending.findIndex((pending) => pending.id === job.id);
    if (index >= 0) this.pending.splice(index, 1);
    job.reject(error);
    this.dispatch();
  }
}

export let mediaQueue = new MediaQueue();

export function assertMediaQueueIdle(queue: MediaQueue): void {
  const snapshot = queue.snapshot();
  if (snapshot.active > 0 || snapshot.pending > 0) throw new Error("MEDIA_QUEUE_RECONFIGURE_BUSY");
}

export function configureMediaQueue(options: Pick<QueueOptions, "maxActive" | "maxPending" | "timeoutMs">): void {
  assertMediaQueueIdle(mediaQueue);
  mediaQueue = new MediaQueue(options);
}
