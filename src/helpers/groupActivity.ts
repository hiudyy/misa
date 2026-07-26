/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import path from "node:path";
import { paths } from "../config/paths.js";
import { readJson, updateJson } from "../storage/jsonStore.js";

export type ActivityStats = {
  messages: number;
  commands: number;
  stickers: number;
  lastAt: string | null;
};

export type ActivityRankEntry = ActivityStats & {
  userId: string;
  total: number;
};

type ActivityData = {
  users: Record<string, ActivityStats>;
};

type ActivityDelta = ActivityStats;

const DEFAULT_STATS: ActivityStats = {
  messages: 0,
  commands: 0,
  stickers: 0,
  lastAt: null,
};

const activityDir = path.join(paths.dados, "atividade");
const FLUSH_INTERVAL_MS = 5_000;
const pending = new Map<string, Map<string, ActivityDelta>>();
let flushTimer: NodeJS.Timeout | null = null;
let flushChain: Promise<void> = Promise.resolve();

function activityPath(groupId: string): string {
  return path.join(activityDir, `${groupId.replace("@g.us", "")}.json`);
}

function normalizeStats(stats?: Partial<ActivityStats>): ActivityStats {
  return {
    messages: typeof stats?.messages === "number" ? stats.messages : 0,
    commands: typeof stats?.commands === "number" ? stats.commands : 0,
    stickers: typeof stats?.stickers === "number" ? stats.stickers : 0,
    lastAt: typeof stats?.lastAt === "string" ? stats.lastAt : null,
  };
}

function getTotal(stats: ActivityStats): number {
  return stats.messages + stats.commands + stats.stickers;
}

function normalizeActivity(value: unknown): ActivityData {
  const input = typeof value === "object" && value !== null ? value as Partial<ActivityData> : {};
  const users = typeof input.users === "object" && input.users !== null ? input.users : {};
  return {
    users: Object.fromEntries(Object.entries(users).map(([userId, stats]) => [userId, normalizeStats(stats)])),
  };
}

function readActivity(groupId: string): Promise<ActivityData> {
  return readJson(activityPath(groupId), { defaultValue: { users: {} }, normalize: normalizeActivity });
}

function mergeDelta(target: ActivityDelta, source: ActivityDelta): void {
  target.messages += source.messages;
  target.commands += source.commands;
  target.stickers += source.stickers;
  if (source.lastAt && (!target.lastAt || source.lastAt > target.lastAt)) target.lastAt = source.lastAt;
}

function requeue(groupId: string, snapshot: Map<string, ActivityDelta>): void {
  const group = pending.get(groupId) ?? new Map<string, ActivityDelta>();
  for (const [userId, delta] of snapshot) {
    const current = group.get(userId) ?? normalizeStats();
    mergeDelta(current, delta);
    group.set(userId, current);
  }
  pending.set(groupId, group);
  scheduleFlush();
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushGroupActivity().catch(() => undefined);
  }, FLUSH_INTERVAL_MS);
  flushTimer.unref?.();
}

async function flushSnapshot(groupId: string, snapshot: Map<string, ActivityDelta>): Promise<void> {
  try {
    await updateJson(activityPath(groupId), { defaultValue: { users: {} }, normalize: normalizeActivity }, (data) => {
      for (const [userId, delta] of snapshot) {
        const current = normalizeStats(data.users[userId]);
        mergeDelta(current, delta);
        data.users[userId] = current;
      }
      return data;
    });
  } catch (error) {
    requeue(groupId, snapshot);
    throw error;
  }
}

export function recordGroupActivity(
  groupId: string,
  userId: string,
  type: "message" | "command" | "sticker",
): void {
  const group = pending.get(groupId) ?? new Map<string, ActivityDelta>();
  const delta = group.get(userId) ?? normalizeStats();
  if (type === "command") delta.commands += 1;
  else if (type === "sticker") delta.stickers += 1;
  else delta.messages += 1;
  delta.lastAt = new Date().toISOString();
  group.set(userId, delta);
  pending.set(groupId, group);
  scheduleFlush();
}

export function flushGroupActivity(groupId?: string): Promise<void> {
  flushChain = flushChain.catch(() => undefined).then(async () => {
    const groupIds = groupId ? [groupId] : [...pending.keys()];
    for (const id of groupIds) {
      const snapshot = pending.get(id);
      if (!snapshot || snapshot.size === 0) continue;
      pending.delete(id);
      await flushSnapshot(id, snapshot);
    }
    if (pending.size === 0 && flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  });
  return flushChain;
}

export async function getUserActivity(groupId: string, userId: string): Promise<ActivityRankEntry> {
  await flushGroupActivity(groupId);
  const data = await readActivity(groupId);
  const stats = normalizeStats(data.users[userId]);
  return { userId, ...stats, total: getTotal(stats) };
}

export async function getActiveRank(groupId: string): Promise<ActivityRankEntry[]> {
  await flushGroupActivity(groupId);
  const data = await readActivity(groupId);
  return Object.entries(data.users)
    .map(([userId, stats]) => {
      const normalized = normalizeStats(stats);
      return { userId, ...normalized, total: getTotal(normalized) };
    })
    .sort((a, b) => b.total - a.total || b.messages - a.messages || b.commands - a.commands || b.stickers - a.stickers);
}

export async function getInactiveRank(groupId: string, participantIds: string[]): Promise<ActivityRankEntry[]> {
  await flushGroupActivity(groupId);
  const data = await readActivity(groupId);
  return participantIds
    .map((userId) => {
      const stats = normalizeStats(data.users[userId]);
      return { userId, ...stats, total: getTotal(stats) };
    })
    .sort((a, b) => {
      if (a.total !== b.total) return a.total - b.total;
      if (a.lastAt === b.lastAt) return 0;
      if (!a.lastAt) return -1;
      if (!b.lastAt) return 1;
      return a.lastAt.localeCompare(b.lastAt);
    });
}

export function clearGroupActivityBufferForTests(): void {
  pending.clear();
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  flushChain = Promise.resolve();
}
