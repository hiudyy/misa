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

const DEFAULT_STATS: ActivityStats = {
  messages: 0,
  commands: 0,
  stickers: 0,
  lastAt: null,
};

const activityDir = path.join(paths.dados, "atividade");

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

export async function recordGroupActivity(
  groupId: string,
  userId: string,
  type: "message" | "command" | "sticker",
): Promise<void> {
  await updateJson(activityPath(groupId), { defaultValue: { users: {} }, normalize: normalizeActivity }, async (data) => {
    const current = normalizeStats(data.users[userId]);

    if (type === "command") current.commands += 1;
    else if (type === "sticker") current.stickers += 1;
    else current.messages += 1;

    current.lastAt = new Date().toISOString();
    data.users[userId] = current;
    return data;
  });
}

export async function getUserActivity(groupId: string, userId: string): Promise<ActivityRankEntry> {
  const data = await readActivity(groupId);
  const stats = normalizeStats(data.users[userId]);
  return { userId, ...stats, total: getTotal(stats) };
}

export async function getActiveRank(groupId: string): Promise<ActivityRankEntry[]> {
  const data = await readActivity(groupId);
  return Object.entries(data.users)
    .map(([userId, stats]) => {
      const normalized = normalizeStats(stats);
      return { userId, ...normalized, total: getTotal(normalized) };
    })
    .sort((a, b) => b.total - a.total || b.messages - a.messages || b.commands - a.commands || b.stickers - a.stickers);
}

export async function getInactiveRank(groupId: string, participantIds: string[]): Promise<ActivityRankEntry[]> {
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
