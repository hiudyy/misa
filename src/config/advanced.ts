/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import type { LogLevel } from "./operations.js";

export function parseAdvancedInteger(input: string, current: number, min: number, max: number): number | null {
  const trimmed = input.trim();
  if (!trimmed) return current;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) && value >= min && value <= max ? value : null;
}

export function parseLogLevel(input: string, current: LogLevel): LogLevel | null {
  const value = input.trim().toLowerCase();
  if (!value) return current;
  return value === "debug" || value === "info" || value === "warn" || value === "error" || value === "silent"
    ? value
    : null;
}
