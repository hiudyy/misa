/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { defaultOperationalConfig } from "./operations.js";

export const CURRENT_CONFIG_SCHEMA_VERSION = 1;

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

export function migrateBotConfig(value: unknown): Record<string, unknown> {
  let current = { ...asObject(value) };
  const rawVersion = current.schemaVersion;
  let version = typeof rawVersion === "number" && Number.isInteger(rawVersion) && rawVersion >= 0 ? rawVersion : 0;

  if (version > CURRENT_CONFIG_SCHEMA_VERSION) {
    throw new Error(`CONFIG_SCHEMA_UNSUPPORTED:${version}:${CURRENT_CONFIG_SCHEMA_VERSION}`);
  }

  while (version < CURRENT_CONFIG_SCHEMA_VERSION) {
    if (version === 0) {
      current = {
        ...current,
        schemaVersion: 1,
        operations: current.operations ?? structuredClone(defaultOperationalConfig),
      };
      version = 1;
      continue;
    }
    throw new Error(`CONFIG_SCHEMA_MIGRATION_MISSING:${version}`);
  }

  return current;
}
