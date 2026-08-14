/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { ErrorCode } from "../localizeError.js";
import { metrics } from "../../metrics.js";
import type { YouTubeProvider, YtFormat, YtProviderContext, YtProviderResolution } from "./types.js";

type PoolOptions = {
  maxFailures?: number;
  cooldownMs?: number;
  retries?: number;
  retryDelayMs?: number;
  now?: () => number;
};

export class YouTubeProviderPool {
  private order: YouTubeProvider[];
  private readonly failures = new Map<string, number>();
  private readonly cooldowns = new Map<string, number>();
  private readonly maxFailures: number;
  private readonly cooldownMs: number;
  private readonly retries: number;
  private readonly retryDelayMs: number;
  private readonly now: () => number;

  constructor(providers: YouTubeProvider[], options: PoolOptions = {}) {
    this.order = [...providers];
    this.maxFailures = options.maxFailures ?? 3;
    this.cooldownMs = options.cooldownMs ?? 5 * 60 * 60_000;
    this.retries = options.retries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 2_000;
    this.now = options.now ?? Date.now;
  }

  async run<T>(
    url: string,
    format: YtFormat,
    context: YtProviderContext,
    use: (provider: YouTubeProvider, resolution: YtProviderResolution) => Promise<T>,
  ): Promise<T> {
    const available = this.order.filter((provider) => {
      if (provider.supports && !provider.supports(format)) return false;
      return !this.inCooldown(provider.name);
    });

    let lastError: unknown = new Error(ErrorCode.DOWNLOAD_FAILED);

    for (const provider of available) {
      if (context.signal?.aborted) throw context.signal.reason;

      let resolution: YtProviderResolution;
      try {
        ({ resolution } = await this.tryProvider(provider, url, format, context));
      } catch (error) {
        if (context.signal?.aborted) throw context.signal.reason ?? error;
        lastError = error;
        this.recordFailure(provider.name);
        this.demote(provider.name);
        continue;
      }

      try {
        const result = await use(provider, resolution);
        this.promote(provider.name);
        return result;
      } catch (useError) {
        if (context.signal?.aborted) throw context.signal.reason ?? useError;
        lastError = useError;
        metrics.recordProvider(provider.name, "failure", 0);
        this.recordFailure(provider.name);
        this.demote(provider.name);
      }
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`${ErrorCode.DOWNLOAD_FAILED}:${message}`);
  }

  getOrder(): string[] {
    return this.order.map((provider) => provider.name);
  }

  getCooldownUntil(name: string): number | undefined {
    return this.cooldowns.get(name);
  }

  getConfiguration(): { maxFailures: number; cooldownMs: number; retries: number; retryDelayMs: number } {
    return {
      maxFailures: this.maxFailures,
      cooldownMs: this.cooldownMs,
      retries: this.retries,
      retryDelayMs: this.retryDelayMs,
    };
  }

  private async tryProvider(
    provider: YouTubeProvider,
    url: string,
    format: YtFormat,
    context: YtProviderContext,
  ): Promise<{ provider: YouTubeProvider; resolution: YtProviderResolution }> {
    let lastError: unknown;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      if (context.signal?.aborted) throw context.signal.reason;
      if (attempt > 0 && this.retryDelayMs > 0) await context.sleep(this.retryDelayMs);
      const startedAt = this.now();
      try {
        const resolution = await provider.resolve(url, format, context);
        metrics.recordProvider(provider.name, "success", this.now() - startedAt);
        this.failures.delete(provider.name);
        return { provider, resolution };
      } catch (error) {
        if (context.signal?.aborted) throw context.signal.reason ?? error;
        lastError = error;
        metrics.recordProvider(provider.name, "failure", this.now() - startedAt);
      }
    }
    throw lastError;
  }

  private inCooldown(name: string): boolean {
    const until = this.cooldowns.get(name);
    if (!until) return false;
    if (this.now() < until) return true;
    this.cooldowns.delete(name);
    this.failures.delete(name);
    return false;
  }

  private recordFailure(name: string): void {
    const failures = (this.failures.get(name) ?? 0) + 1;
    this.failures.set(name, failures);
    if (failures >= this.maxFailures) {
      this.cooldowns.set(name, this.now() + this.cooldownMs);
      metrics.recordProviderCooldown(name);
    }
  }

  private promote(name: string): void {
    this.order = [...this.order.filter((provider) => provider.name === name), ...this.order.filter((provider) => provider.name !== name)];
  }

  private demote(name: string): void {
    this.order = [...this.order.filter((provider) => provider.name !== name), ...this.order.filter((provider) => provider.name === name)];
  }
}
