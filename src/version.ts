/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import packageInfo from "../package.json" with { type: "json" };
import { paths } from "./config/paths.js";
import { CURRENT_CONFIG_SCHEMA_VERSION } from "./config/migrations.js";

export type BuildInfo = {
  version: string;
  commit: string;
  schemaVersion: number;
};

export type BuildInfoDependencies = {
  statePath?: string;
  env?: NodeJS.ProcessEnv;
  readFile?: typeof fs.readFile;
  gitCommit?: () => string;
};

function normalizeCommit(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const commit = value.trim();
  return /^[a-f0-9]{7,40}$/i.test(commit) ? commit.slice(0, 12).toLowerCase() : null;
}

export async function resolveBuildInfo(dependencies: BuildInfoDependencies = {}): Promise<BuildInfo> {
  const readFile = dependencies.readFile ?? fs.readFile;
  const statePath = dependencies.statePath ?? paths.updateState;
  const env = dependencies.env ?? process.env;
  let commit: string | null = null;

  try {
    const state = JSON.parse(await readFile(statePath, "utf8")) as { commit?: unknown };
    commit = normalizeCommit(state.commit);
  } catch {
    // Sem state aplicado pelo auto-update.
  }

  commit ??= normalizeCommit(env.MISA_COMMIT_SHA) ?? normalizeCommit(env.GITHUB_SHA);
  if (!commit) {
    try {
      const gitCommit = dependencies.gitCommit ?? (() => execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
        cwd: paths.root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }));
      commit = normalizeCommit(gitCommit());
    } catch {
      // Imagens/ZIPs podem nao conter .git.
    }
  }

  return {
    version: packageInfo.version,
    commit: commit ?? "unknown",
    schemaVersion: CURRENT_CONFIG_SCHEMA_VERSION,
  };
}

let buildInfoPromise: Promise<BuildInfo> | null = null;

export function getBuildInfo(): Promise<BuildInfo> {
  buildInfoPromise ??= resolveBuildInfo();
  return buildInfoPromise;
}

export function resetBuildInfoCacheForTests(): void {
  buildInfoPromise = null;
}
