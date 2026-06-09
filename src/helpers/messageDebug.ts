/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { inspect } from "node:util";

let messageDebugEnabled = false;

export function isMessageDebugEnabled(): boolean {
  return messageDebugEnabled;
}

export function setMessageDebugEnabled(enabled: boolean): boolean {
  messageDebugEnabled = enabled;
  return messageDebugEnabled;
}

export function toggleMessageDebug(): boolean {
  return setMessageDebugEnabled(!messageDebugEnabled);
}

export function logMessageDebug(event: unknown): void {
  console.log("\n[DEBUG messages.upsert]");
  console.log(inspect(event, { colors: process.stdout.isTTY, depth: null, compact: false }));
}
