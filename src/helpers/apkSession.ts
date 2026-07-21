/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { ModyoloAppInfo, ModyoloSearchResult, ModyoloVersion } from "./modyoloDownload.js";

export type ApkSessionStep = "select_app" | "select_version";

export type ApkSession = {
  from: string;
  sender: string;
  step: ApkSessionStep;
  results: ModyoloSearchResult[];
  appInfo?: ModyoloAppInfo;
  versions?: ModyoloVersion[];
  createdAt: number;
};

const SESSION_TTL_MS = 5 * 60 * 1000;
const sessions = new Map<string, ApkSession>();

function key(from: string, sender: string): string {
  return `${from}:${sender}`;
}

export function getApkSession(from: string, sender: string): ApkSession | undefined {
  const session = sessions.get(key(from, sender));
  if (!session) return undefined;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(key(from, sender));
    return undefined;
  }
  return session;
}

export function setApkSession(session: ApkSession): void {
  sessions.set(key(session.from, session.sender), session);
}

export function deleteApkSession(from: string, sender: string): void {
  sessions.delete(key(from, sender));
}

export function cleanupApkSessions(): void {
  const now = Date.now();
  for (const [k, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(k);
  }
}

setInterval(cleanupApkSessions, 60_000).unref?.();
