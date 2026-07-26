/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { log } from "../logger.js";

export type JsonNormalizer<T> = (value: unknown) => T;

type JsonOptions<T> = {
  defaultValue: T;
  normalize: JsonNormalizer<T>;
  repair?: boolean;
};

const queues = new Map<string, Promise<unknown>>();

function clone<T>(value: T): T {
  return structuredClone(value);
}

function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function runExclusive<T>(filePath: string, action: () => Promise<T>): Promise<T> {
  const previous = queues.get(filePath) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(action);
  const tracked = current.catch(() => undefined).finally(() => {
    if (queues.get(filePath) === tracked) queues.delete(filePath);
  });

  queues.set(filePath, tracked);
  return current;
}

async function atomicWrite(filePath: string, value: unknown): Promise<void> {
  const directory = path.dirname(filePath);
  const temporary = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`);
  await fs.mkdir(directory, { recursive: true });

  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    await handle.writeFile(serialize(value), "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await fs.rename(temporary, filePath);
  } finally {
    await handle?.close().catch(() => undefined);
    await fs.rm(temporary, { force: true }).catch(() => undefined);
  }
}

function corruptPath(filePath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${filePath}.corrupt-${timestamp}`;
}

async function readUnlocked<T>(filePath: string, options: JsonOptions<T>): Promise<T> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return clone(options.defaultValue);
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const backup = corruptPath(filePath);
    await fs.copyFile(filePath, backup);
    const fallback = clone(options.defaultValue);
    await atomicWrite(filePath, fallback);
    log.error("STORAGE", `JSON_INVALID:${filePath}; BACKUP:${backup}`, error);
    return fallback;
  }

  const normalized = options.normalize(parsed);
  if (options.repair !== false && serialize(parsed) !== serialize(normalized)) {
    await atomicWrite(filePath, normalized);
    log.warn("STORAGE", `JSON_REPAIRED:${filePath}`);
  }
  return normalized;
}

export function readJson<T>(filePath: string, options: JsonOptions<T>): Promise<T> {
  return runExclusive(filePath, () => readUnlocked(filePath, options));
}

export function writeJson<T>(filePath: string, value: T): Promise<void> {
  return runExclusive(filePath, () => atomicWrite(filePath, value));
}

export function updateJson<T>(
  filePath: string,
  options: JsonOptions<T>,
  update: (current: T) => T | Promise<T>,
): Promise<T> {
  return runExclusive(filePath, async () => {
    const current = await readUnlocked(filePath, { ...options, repair: false });
    const next = options.normalize(await update(clone(current)));
    if (serialize(current) !== serialize(next)) await atomicWrite(filePath, next);
    return next;
  });
}

export async function drainJsonWrites(): Promise<void> {
  while (queues.size > 0) {
    await Promise.allSettled([...queues.values()]);
  }
}

export { atomicWrite };
