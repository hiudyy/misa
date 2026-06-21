/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { proto, WASocket } from "baileys";
import { getGroup } from "../database/groupDB.js";
import { log } from "../logger.js";
import type { Locale } from "../i18n/index.js";

const STEALTH_WINDOW_MS = 4_000;

type UserStealthState = {
  normalMessages: number;
  stealthTimestamps: number[];
};

const userStates = new Map<string, UserStealthState>();

function stateKey(groupId: string, sender: string): string {
  return `${groupId}:${sender}`;
}

function getState(groupId: string, sender: string): UserStealthState {
  const key = stateKey(groupId, sender);
  const current = userStates.get(key);
  if (current) return current;

  const created: UserStealthState = { normalMessages: 0, stealthTimestamps: [] };
  userStates.set(key, created);
  return created;
}

export function countNormalGroupMessage(groupId: string, sender: string): void {
  const state = getState(groupId, sender);
  state.normalMessages += 1;
  state.stealthTimestamps = [];
}

export function isNoSessionDecryptMessage(message: proto.IWebMessageInfo): boolean {
  return (
    !message.message &&
    message.messageStubType === 2 &&
    message.messageStubParameters?.includes("No session found to decrypt message") === true
  );
}

export async function applyAntiStealth(
  misa: WASocket,
  message: proto.IWebMessageInfo,
  groupId: string,
  sender: string,
  locale: Locale,
): Promise<boolean> {
  if (!isNoSessionDecryptMessage(message)) return false;

  const config = await getGroup(groupId);
  if (!config.antistealth) return false;

  const now = Date.now();
  const state = getState(groupId, sender);
  state.stealthTimestamps = [...state.stealthTimestamps, now].filter((timestamp) => now - timestamp <= STEALTH_WINDOW_MS);

  const threshold = state.normalMessages === 0 ? 2 : 3;
  if (state.stealthTimestamps.length < threshold) return true;

  const { t } = await import("../i18n/index.js");

  try {
    if (message.key) await misa.sendMessage(groupId, { delete: message.key });
  } catch (error) {
    log.warn("ANTISTEALTH", t("logs.antistealthDeleteFailed", locale, { groupId, error: String(error) }));
  }

  try {
    await misa.groupParticipantsUpdate(groupId, [sender], "remove");
  } catch (error) {
    log.warn("ANTISTEALTH", t("logs.antistealthRemoveFailed", locale, { sender, groupId, error: String(error) }));
  }

  await misa.sendMessage(groupId, {
    text: t("commands.antistealth.punished", locale, {
      user: sender.split("@")[0],
      count: String(state.stealthTimestamps.length),
      seconds: String(STEALTH_WINDOW_MS / 1000),
    }),
    mentions: [sender],
  });

  state.stealthTimestamps = [];
  return true;
}
