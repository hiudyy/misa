/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { proto } from "baileys";
import { log } from "../logger.js";
import { groupCache } from "../cache/groupCache.js";

export const PREVIEW_MAX_LENGTH = 80;

type ActivityTranslator = (key: string, vars?: Record<string, string>) => string;

export function truncatePreview(text: string, maxLength = PREVIEW_MAX_LENGTH): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  if (maxLength <= 1) return "…";
  return `${collapsed.slice(0, maxLength - 1)}…`;
}

export function getActivityUserName(message: proto.IWebMessageInfo, sender: string): string {
  const pushName = message.pushName?.trim();
  if (pushName) return pushName;
  const digits = sender.split("@")[0] || "";
  return digits || "?";
}

export function getActivityDestination(
  isGroup: boolean,
  from: string,
  t: ActivityTranslator,
): string {
  if (!isGroup) return t("logs.activity.privateLabel");
  return groupCache.get(from)?.subject?.trim() || t("logs.activity.unknownGroup");
}

export function getActivityPreview(
  message: proto.IWebMessageInfo,
  body: string,
  t: ActivityTranslator,
): string {
  const truncated = truncatePreview(body);
  if (truncated) return truncated;

  if (message.message?.stickerMessage) return t("logs.activity.sticker");
  if (
    message.message?.imageMessage ||
    message.message?.videoMessage ||
    message.message?.audioMessage ||
    message.message?.documentMessage ||
    message.message?.documentWithCaptionMessage
  ) {
    return t("logs.activity.media");
  }

  return t("logs.activity.media");
}

export function formatActivityLine(
  isGroup: boolean,
  from: string,
  user: string,
  preview: string,
  t: ActivityTranslator,
): string {
  if (isGroup) {
    return t("logs.activity.group", {
      user,
      group: getActivityDestination(true, from, t),
      preview,
    });
  }

  return t("logs.activity.private", {
    user,
    privateLabel: t("logs.activity.privateLabel"),
    preview,
  });
}

export function logMessageActivity(params: {
  message: proto.IWebMessageInfo;
  from: string;
  sender: string;
  isGroup: boolean;
  body: string;
  t: ActivityTranslator;
}): void {
  const user = getActivityUserName(params.message, params.sender);
  const preview = getActivityPreview(params.message, params.body, params.t);
  const line = formatActivityLine(params.isGroup, params.from, user, preview, params.t);
  log.activity("MSG", line);
}

export function logCommandActivity(params: {
  message: proto.IWebMessageInfo;
  from: string;
  sender: string;
  isGroup: boolean;
  prefix: string;
  commandName: string;
  args: string[];
  t: ActivityTranslator;
}): void {
  const user = getActivityUserName(params.message, params.sender);
  const commandPreview = truncatePreview(
    [params.prefix + params.commandName, ...params.args].join(" "),
  );
  const line = formatActivityLine(params.isGroup, params.from, user, commandPreview, params.t);
  log.activity("CMD", line);
}
