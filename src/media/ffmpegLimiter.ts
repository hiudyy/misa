/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
type Waiter = {
  resolve: (release: () => void) => void;
  reject: (reason: unknown) => void;
  signal?: AbortSignal;
  onAbort?: () => void;
};

export class FfmpegLimiter {
  private activeCount = 0;
  private readonly waiters: Waiter[] = [];

  constructor(private readonly maxActive = 1) {
    if (!Number.isInteger(maxActive) || maxActive < 1) throw new Error("FFMPEG_CONCURRENCY_INVALID");
  }

  async run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const release = await this.acquire(signal);
    try {
      return await task();
    } finally {
      release();
    }
  }

  get active(): number {
    return this.activeCount;
  }

  get pending(): number {
    return this.waiters.length;
  }

  get capacity(): number {
    return this.maxActive;
  }

  private acquire(signal?: AbortSignal): Promise<() => void> {
    if (signal?.aborted) return Promise.reject(signal.reason ?? new Error("MEDIA_ABORTED"));
    if (this.activeCount < this.maxActive) {
      this.activeCount += 1;
      return Promise.resolve(this.createRelease());
    }

    return new Promise((resolve, reject) => {
      const waiter: Waiter = { resolve, reject, signal };
      waiter.onAbort = () => {
        const index = this.waiters.indexOf(waiter);
        if (index >= 0) this.waiters.splice(index, 1);
        reject(signal?.reason ?? new Error("MEDIA_ABORTED"));
      };
      signal?.addEventListener("abort", waiter.onAbort, { once: true });
      this.waiters.push(waiter);
    });
  }

  private createRelease(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const waiter = this.waiters.shift();
      if (!waiter) {
        this.activeCount -= 1;
        return;
      }
      waiter.signal?.removeEventListener("abort", waiter.onAbort!);
      waiter.resolve(this.createRelease());
    };
  }
}

export let ffmpegLimiter = new FfmpegLimiter();

export function assertFfmpegLimiterIdle(limiter: FfmpegLimiter): void {
  if (limiter.active > 0 || limiter.pending > 0) throw new Error("FFMPEG_RECONFIGURE_BUSY");
}

export function configureFfmpegLimiter(maxActive: number): void {
  assertFfmpegLimiterIdle(ffmpegLimiter);
  ffmpegLimiter = new FfmpegLimiter(maxActive);
}
