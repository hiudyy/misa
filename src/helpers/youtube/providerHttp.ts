/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { createDecipheriv } from "node:crypto";
import { ErrorCode } from "../localizeError.js";
import type { YtProviderContext } from "./types.js";

export const PROVIDER_TIMEOUT_MS = 60_000;
export const PROVIDER_DOWNLOAD_TIMEOUT_MS = 180_000;
export const SAVETUBE_KEY_DEFAULT = "C5D58EF67A7584E4A29F6C35BBC4EB12";
export const BRONXYSHOST_KEY = "juniornerd_ISM";

export function providerSignal(context: YtProviderContext, timeoutMs = PROVIDER_TIMEOUT_MS): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return context.signal ? AbortSignal.any([context.signal, timeout]) : timeout;
}

export async function fetchJson<T>(
  context: YtProviderContext,
  input: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await context.fetch(input, {
    ...init,
    signal: init.signal ?? providerSignal(context),
  });
  if (!response.ok) throw new Error(`${ErrorCode.DOWNLOAD_FAILED}:HTTP_${response.status}`);
  return response.json() as Promise<T>;
}

export function decodeSavetube(encoded: string): Record<string, unknown> {
  const keyHex = process.env.YT_SAVETUBE_SECRET_KEY || SAVETUBE_KEY_DEFAULT;
  const key = Buffer.from(keyHex, "hex");
  const data = Buffer.from(encoded, "base64");
  if (data.length < 16) throw new Error(ErrorCode.DOWNLOAD_NO_DATA);
  const decipher = createDecipheriv("aes-128-cbc", key, data.subarray(0, 16));
  const decrypted = Buffer.concat([decipher.update(data.subarray(16)), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as Record<string, unknown>;
}
