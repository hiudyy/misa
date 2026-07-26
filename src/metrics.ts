/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
export type Outcome = "success" | "failure";

type DurationStats = {
  count: number;
  totalMs: number;
  maxMs: number;
};

type OperationStats = DurationStats & {
  success: number;
  failure: number;
};

type CacheStats = {
  hits: number;
  misses: number;
};

type ProviderStats = OperationStats & {
  cooldowns: number;
};

export type MetricsSnapshot = {
  messages: {
    received: number;
    processed: number;
    failed: number;
    queued: number;
    dropped: number;
    timedOut: number;
    active: number;
    pending: number;
  };
  commands: { started: number; success: number; failure: number; denied: number };
  commandStats: Readonly<Record<string, OperationStats>>;
  media: {
    queued: number;
    started: number;
    success: number;
    failure: number;
    rejected: number;
    timeout: number;
    bytes: number;
  };
  mediaStats: Readonly<Record<string, OperationStats>>;
  providers: Readonly<Record<string, ProviderStats>>;
  caches: Readonly<Record<string, CacheStats>>;
  reconnects: number;
};

function durationStats(): DurationStats {
  return { count: 0, totalMs: 0, maxMs: 0 };
}

function operationStats(): OperationStats {
  return { ...durationStats(), success: 0, failure: 0 };
}

function providerStats(): ProviderStats {
  return { ...operationStats(), cooldowns: 0 };
}

function cloneRecord<T extends object>(source: Map<string, T>): Record<string, T> {
  return Object.fromEntries([...source].map(([key, value]) => [key, { ...value }]));
}

class MetricsRegistry {
  private messages = { received: 0, processed: 0, failed: 0, queued: 0, dropped: 0, timedOut: 0, active: 0, pending: 0 };
  private commands = { started: 0, success: 0, failure: 0, denied: 0 };
  private media = { queued: 0, started: 0, success: 0, failure: 0, rejected: 0, timeout: 0, bytes: 0 };
  private reconnects = 0;
  private readonly commandStats = new Map<string, OperationStats>();
  private readonly mediaStats = new Map<string, OperationStats>();
  private readonly providers = new Map<string, ProviderStats>();
  private readonly caches = new Map<string, CacheStats>();

  recordMessage(stage: "received" | "processed" | "failed" | "queued" | "dropped" | "timedOut"): void {
    this.messages[stage] += 1;
  }

  setMessageDispatch(active: number, pending: number): void {
    this.messages.active = active;
    this.messages.pending = pending;
  }

  startCommand(): void {
    this.commands.started += 1;
  }

  denyCommand(): void {
    this.commands.denied += 1;
  }

  recordCommand(name: string, outcome: Outcome, durationMs: number): void {
    this.commands[outcome === "success" ? "success" : "failure"] += 1;
    this.recordOperation(this.commandStats, name, outcome, durationMs);
  }

  recordMediaEvent(event: "queued" | "started" | "rejected" | "timeout"): void {
    this.media[event] += 1;
  }

  recordMedia(kind: string, outcome: Outcome, durationMs: number): void {
    this.media[outcome === "success" ? "success" : "failure"] += 1;
    this.recordOperation(this.mediaStats, kind, outcome, durationMs);
  }

  addMediaBytes(bytes: number): void {
    if (Number.isFinite(bytes) && bytes > 0) this.media.bytes += bytes;
  }

  recordProvider(name: string, outcome: Outcome, durationMs: number): void {
    const current = this.providers.get(name) ?? providerStats();
    current[outcome] += 1;
    current.count += 1;
    current.totalMs += Math.max(0, durationMs);
    current.maxMs = Math.max(current.maxMs, durationMs);
    this.providers.set(name, current);
  }

  recordProviderCooldown(name: string): void {
    const current = this.providers.get(name) ?? providerStats();
    current.cooldowns += 1;
    this.providers.set(name, current);
  }

  recordCache(name: string, hit: boolean): void {
    const current = this.caches.get(name) ?? { hits: 0, misses: 0 };
    current[hit ? "hits" : "misses"] += 1;
    this.caches.set(name, current);
  }

  recordReconnect(): void {
    this.reconnects += 1;
  }

  snapshot(): MetricsSnapshot {
    return structuredClone({
      messages: { ...this.messages },
      commands: { ...this.commands },
      commandStats: cloneRecord(this.commandStats),
      media: { ...this.media },
      mediaStats: cloneRecord(this.mediaStats),
      providers: cloneRecord(this.providers),
      caches: cloneRecord(this.caches),
      reconnects: this.reconnects,
    });
  }

  reset(): void {
    this.messages = { received: 0, processed: 0, failed: 0, queued: 0, dropped: 0, timedOut: 0, active: 0, pending: 0 };
    this.commands = { started: 0, success: 0, failure: 0, denied: 0 };
    this.media = { queued: 0, started: 0, success: 0, failure: 0, rejected: 0, timeout: 0, bytes: 0 };
    this.reconnects = 0;
    this.commandStats.clear();
    this.mediaStats.clear();
    this.providers.clear();
    this.caches.clear();
  }

  private recordOperation(map: Map<string, OperationStats>, name: string, outcome: Outcome, durationMs: number): void {
    const current = map.get(name) ?? operationStats();
    current[outcome] += 1;
    current.count += 1;
    current.totalMs += Math.max(0, durationMs);
    current.maxMs = Math.max(current.maxMs, durationMs);
    map.set(name, current);
  }
}

export const metrics = new MetricsRegistry();
export function resetMetricsForTests(): void {
  metrics.reset();
}
