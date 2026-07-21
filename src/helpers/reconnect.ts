/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { DisconnectReason } from "baileys";

/** Motivos em que reconectar automaticamente não faz sentido. */
const NO_RECONNECT = new Set<number>([
  DisconnectReason.loggedOut,
  DisconnectReason.forbidden,
  DisconnectReason.multideviceMismatch,
  DisconnectReason.connectionReplaced,
  DisconnectReason.badSession,
]);

/**
 * Decide se o bot deve tentar reconectar a partir do statusCode do Baileys.
 */
export function shouldReconnectFromStatus(statusCode: number | undefined): boolean {
  if (statusCode === undefined) return true;
  return !NO_RECONNECT.has(statusCode);
}

/**
 * Extrai o statusCode de um erro de desconexão do Baileys.
 */
export function getDisconnectStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const output = (error as { output?: { statusCode?: number } }).output;
  return output?.statusCode;
}
