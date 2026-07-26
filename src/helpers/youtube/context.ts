/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { YtProviderContext } from "./types.js";

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function createProviderContext(fetchImpl: typeof fetch, signal?: AbortSignal): YtProviderContext {
  return {
    fetch: fetchImpl,
    signal,
    sleep: (ms) => abortableSleep(ms, signal),
  };
}
