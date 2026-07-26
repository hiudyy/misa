/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
export type ShutdownReason = "sigint" | "sigterm" | "restart";

let shutdownHandler: ((reason: ShutdownReason) => void) | null = null;

export function setShutdownHandler(handler: ((reason: ShutdownReason) => void) | null): void {
  shutdownHandler = handler;
}

export function requestShutdown(reason: ShutdownReason): void {
  if (shutdownHandler) {
    shutdownHandler(reason);
    return;
  }
  process.exitCode = 0;
}
