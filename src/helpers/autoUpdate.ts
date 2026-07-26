/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { createHash } from "node:crypto";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { constants } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import { paths } from "../config/paths.js";
import { createTranslator, getGlobalLocale } from "../i18n/index.js";
import { log } from "../logger.js";
import { readJson, writeJson } from "../storage/jsonStore.js";

const REF_URL = "https://api.github.com/repos/hiudyy/misa/git/ref/heads/main";
const ARCHIVE_URL = (sha: string) => `https://github.com/hiudyy/misa/archive/${sha}.zip`;
const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;
const MAX_ENTRY_BYTES = 50 * 1024 * 1024;
const MAX_EXTRACTED_BYTES = 200 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 10_000;
const MAX_BACKUPS = 5;
const RUNTIME_ITEMS = ["src", "scripts", "dist", "package.json", "package-lock.json"] as const;

type UpdateState = {
  commit: string;
  archiveSha256: string;
  appliedAt: string;
};

type UpdateLayout = {
  root: string;
  data: string;
  zip: string;
  extract: string;
  backups: string;
  state: string;
};

export type AutoUpdateDependencies = {
  fetch?: typeof fetch;
  root?: string;
  dataDir?: string;
  runCommand?: (command: string, args: string[], cwd: string) => void;
  approveScripts?: (cwd: string) => boolean;
  restart?: (root: string) => void;
  exit?: (code: number) => never | void;
  maxBackups?: number;
};

function getLayout(root = paths.root, data = paths.dados): UpdateLayout {
  return {
    root,
    data,
    zip: path.join(data, "update.zip"),
    extract: path.join(data, "update-tmp"),
    backups: path.join(data, "backups"),
    state: path.join(data, "update-state.json"),
  };
}

function npmExecutable(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function defaultRunCommand(command: string, args: string[], cwd: string): void {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

function defaultRestart(root: string): void {
  const child = spawn(npmExecutable(), ["run", "start:fast", "--", "--no-update"], {
    cwd: root,
    detached: true,
    stdio: "inherit",
  });
  child.unref();
}

/** Approves pending dependency scripts; soft-fails when npm does not support it. */
export function approveNpmInstallScripts(cwd: string): boolean {
  const result = spawnSync(npmExecutable(), ["approve-scripts", "--all", "--no-allow-scripts-pin"], {
    cwd,
    encoding: "utf8",
  });
  if (result.status === 0) return true;
  const detail = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();
  if (/Unknown command:\s*"?approve-scripts"?/i.test(detail)) return false;
  if (detail) log.warn("UPDATE", detail);
  return false;
}

async function cleanup(layout: UpdateLayout): Promise<void> {
  await fs.rm(layout.zip, { force: true });
  await fs.rm(layout.extract, { force: true, recursive: true });
}

export function selectBackupsToDelete(backupNames: string[], maxBackups: number): string[] {
  const sorted = [...backupNames].filter((name) => name.startsWith("update-")).sort();
  return sorted.length <= maxBackups ? [] : sorted.slice(0, sorted.length - maxBackups);
}

async function cleanupOldBackups(layout: UpdateLayout, maxBackups: number): Promise<void> {
  try {
    const entries = await fs.readdir(layout.backups, { withFileTypes: true });
    const names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    for (const name of selectBackupsToDelete(names, maxBackups)) {
      await fs.rm(path.join(layout.backups, name), { force: true, recursive: true });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function copyIfExists(source: string, destination: string): Promise<void> {
  try {
    const stat = await fs.stat(source);
    if (stat.isDirectory()) await fs.cp(source, destination, { recursive: true });
    else {
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(source, destination);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function createBackup(layout: UpdateLayout, maxBackups: number): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(layout.backups, `update-${timestamp}`);
  await fs.mkdir(backup, { recursive: true });
  for (const item of RUNTIME_ITEMS) {
    await copyIfExists(path.join(layout.root, item), path.join(backup, item));
  }
  await cleanupOldBackups(layout, maxBackups);
  return backup;
}

async function replaceRuntime(source: string, destination: string): Promise<void> {
  for (const item of RUNTIME_ITEMS) {
    const target = path.join(destination, item);
    await fs.rm(target, { force: true, recursive: true });
    await copyIfExists(path.join(source, item), target);
  }
}

function normalizeState(value: unknown): UpdateState {
  const input = typeof value === "object" && value !== null ? value as Partial<UpdateState> : {};
  return {
    commit: typeof input.commit === "string" ? input.commit : "",
    archiveSha256: typeof input.archiveSha256 === "string" ? input.archiveSha256 : "",
    appliedAt: typeof input.appliedAt === "string" ? input.appliedAt : "",
  };
}

async function resolveMainSha(fetchImpl: typeof fetch): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "misa-bot-auto-update",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetchImpl(REF_URL, { headers, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`UPDATE_REF_HTTP_${response.status}`);
  const data = await response.json() as { object?: { sha?: unknown } };
  const sha = data.object?.sha;
  if (typeof sha !== "string" || !/^[a-f0-9]{40}$/i.test(sha)) throw new Error("UPDATE_REF_SHA_INVALID");
  return sha.toLowerCase();
}

async function downloadArchive(fetchImpl: typeof fetch, url: string, destination: string): Promise<string> {
  const response = await fetchImpl(url, {
    headers: { "User-Agent": "misa-bot-auto-update" },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`UPDATE_DOWNLOAD_HTTP_${response.status}`);
  const announced = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(announced) && announced > MAX_ARCHIVE_BYTES) throw new Error("UPDATE_ARCHIVE_TOO_LARGE");
  if (!response.body) throw new Error("UPDATE_ARCHIVE_EMPTY");

  await fs.mkdir(path.dirname(destination), { recursive: true });
  const handle = await fs.open(destination, "w", 0o600);
  const hash = createHash("sha256");
  let total = 0;
  try {
    for await (const chunk of response.body) {
      const buffer = Buffer.from(chunk);
      total += buffer.length;
      if (total > MAX_ARCHIVE_BYTES) throw new Error("UPDATE_ARCHIVE_TOO_LARGE");
      hash.update(buffer);
      await handle.write(buffer);
    }
    await handle.sync();
  } finally {
    await handle.close();
  }
  if (total === 0) throw new Error("UPDATE_ARCHIVE_EMPTY");
  return hash.digest("hex");
}

function readUInt64LE(buffer: Buffer, offset: number): number {
  if (offset < 0 || offset + 8 > buffer.length) throw new Error("UPDATE_ZIP_BOUNDS");
  const value = buffer.readBigUInt64LE(offset);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("UPDATE_ZIP_TOO_LARGE");
  return Number(value);
}

function findEndOfCentralDirectory(zip: Buffer): number {
  const minOffset = Math.max(0, zip.length - 0xffff - 22);
  for (let offset = zip.length - 22; offset >= minOffset; offset--) {
    if (zip.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error("UPDATE_ZIP_EOCD_NOT_FOUND");
}

function getCentralDirectory(zip: Buffer): { offset: number; entries: number } {
  const eocd = findEndOfCentralDirectory(zip);
  const entries = zip.readUInt16LE(eocd + 10);
  const offset = zip.readUInt32LE(eocd + 16);
  if (entries !== 0xffff && offset !== 0xffffffff) return { offset, entries };

  const locator = eocd - 20;
  if (locator < 0 || zip.readUInt32LE(locator) !== 0x07064b50) throw new Error("UPDATE_ZIP64_LOCATOR_INVALID");
  const zip64 = readUInt64LE(zip, locator + 8);
  if (zip.readUInt32LE(zip64) !== 0x06064b50) throw new Error("UPDATE_ZIP64_EOCD_INVALID");
  return { offset: readUInt64LE(zip, zip64 + 48), entries: readUInt64LE(zip, zip64 + 32) };
}

export function safeExtractPath(destination: string, fileName: string): string {
  const normalizedName = fileName.replace(/\\/g, "/");
  const target = path.resolve(destination, normalizedName);
  const root = path.resolve(destination);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error(`UPDATE_ZIP_UNSAFE_ENTRY:${fileName}`);
  }
  return target;
}

async function extractZip(zipPath: string, destination: string): Promise<void> {
  const zip = await fs.readFile(zipPath);
  const central = getCentralDirectory(zip);
  if (central.entries > MAX_ZIP_ENTRIES) throw new Error("UPDATE_ZIP_TOO_MANY_ENTRIES");
  let offset = central.offset;
  let extractedBytes = 0;
  await fs.mkdir(destination, { recursive: true });

  for (let index = 0; index < central.entries; index++) {
    if (offset < 0 || offset + 46 > zip.length || zip.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("UPDATE_ZIP_CENTRAL_CORRUPT");
    }
    const compression = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const uncompressedSize = zip.readUInt32LE(offset + 24);
    const fileNameSize = zip.readUInt16LE(offset + 28);
    const extraSize = zip.readUInt16LE(offset + 30);
    const commentSize = zip.readUInt16LE(offset + 32);
    const localOffset = zip.readUInt32LE(offset + 42);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      throw new Error("UPDATE_ZIP64_ENTRY_UNSUPPORTED");
    }
    if (uncompressedSize > MAX_ENTRY_BYTES) throw new Error("UPDATE_ZIP_ENTRY_TOO_LARGE");
    extractedBytes += uncompressedSize;
    if (extractedBytes > MAX_EXTRACTED_BYTES) throw new Error("UPDATE_ZIP_EXPANDED_TOO_LARGE");
    if (offset + 46 + fileNameSize + extraSize + commentSize > zip.length) throw new Error("UPDATE_ZIP_BOUNDS");

    const fileName = zip.toString("utf8", offset + 46, offset + 46 + fileNameSize);
    offset += 46 + fileNameSize + extraSize + commentSize;
    const target = safeExtractPath(destination, fileName);
    if (fileName.endsWith("/")) {
      await fs.mkdir(target, { recursive: true });
      continue;
    }
    if (localOffset + 30 > zip.length || zip.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`UPDATE_ZIP_LOCAL_HEADER_MISSING:${fileName}`);
    }
    const localNameSize = zip.readUInt16LE(localOffset + 26);
    const localExtraSize = zip.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameSize + localExtraSize;
    if (dataOffset + compressedSize > zip.length) throw new Error("UPDATE_ZIP_BOUNDS");
    const compressed = zip.subarray(dataOffset, dataOffset + compressedSize);
    const data = compression === 0
      ? compressed
      : compression === 8
        ? inflateRawSync(compressed, { maxOutputLength: MAX_ENTRY_BYTES })
        : (() => { throw new Error(`UPDATE_ZIP_COMPRESSION_UNSUPPORTED:${compression}`); })();
    if (data.length !== uncompressedSize || data.length > MAX_ENTRY_BYTES) throw new Error("UPDATE_ZIP_SIZE_MISMATCH");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data, { mode: 0o600 });
  }
}

async function getStagingRoot(extractDir: string): Promise<string> {
  const entries = (await fs.readdir(extractDir, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  if (entries.length !== 1) throw new Error("UPDATE_ARCHIVE_ROOT_INVALID");
  return path.join(extractDir, entries[0].name);
}

async function validateStaging(root: string): Promise<void> {
  for (const item of ["src", "scripts", "package.json", "package-lock.json"]) {
    await fs.access(path.join(root, item), constants.R_OK);
  }
}

function runValidation(
  root: string,
  runner: NonNullable<AutoUpdateDependencies["runCommand"]>,
  approveScripts: NonNullable<AutoUpdateDependencies["approveScripts"]>,
): void {
  const npm = npmExecutable();
  runner(npm, ["ci"], root);
  approveScripts(root);
  runner(npm, ["run", "check:i18n"], root);
  runner(npm, ["test"], root);
  runner(npm, ["run", "build"], root);
  runner(npm, ["run", "test:dist"], root);
}

export async function runAutoUpdate(dependencies: AutoUpdateDependencies = {}): Promise<void> {
  const fetchImpl = dependencies.fetch ?? fetch;
  const root = dependencies.root ?? paths.root;
  const layout = getLayout(root, dependencies.dataDir ?? path.join(root, "dados"));
  const runner = dependencies.runCommand ?? defaultRunCommand;
  const approveScripts = dependencies.approveScripts ?? approveNpmInstallScripts;
  const restart = dependencies.restart ?? defaultRestart;
  const exit = dependencies.exit ?? ((code: number) => process.exit(code));
  const maxBackups = dependencies.maxBackups ?? MAX_BACKUPS;
  const locale = await getGlobalLocale();
  const t = createTranslator(locale);
  let backup: string | null = null;
  let activated = false;

  log.info("UPDATE", t("update.checking"));
  try {
    const commit = await resolveMainSha(fetchImpl);
    const state = await readJson(layout.state, {
      defaultValue: { commit: "", archiveSha256: "", appliedAt: "" },
      normalize: normalizeState,
    });
    if (state.commit === commit) {
      log.success("UPDATE", t("update.upToDate"));
      return;
    }

    await cleanup(layout);
    await fs.mkdir(layout.extract, { recursive: true });
    log.info("UPDATE", t("update.downloading"));
    const archiveSha256 = await downloadArchive(fetchImpl, ARCHIVE_URL(commit), layout.zip);
    log.info("UPDATE", t("update.extracting"));
    await extractZip(layout.zip, layout.extract);
    const staging = await getStagingRoot(layout.extract);
    await validateStaging(staging);
    log.info("UPDATE", t("update.installingDeps"));
    runValidation(staging, runner, approveScripts);

    log.info("UPDATE", t("update.creatingBackup"));
    backup = await createBackup(layout, maxBackups);
    log.success("UPDATE", t("update.backupCreated", { path: backup }));
    activated = true;
    await replaceRuntime(staging, root);

    runner(npmExecutable(), ["ci"], root);
    approveScripts(root);
    runner(npmExecutable(), ["run", "test:dist"], root);
    await writeJson(layout.state, { commit, archiveSha256, appliedAt: new Date().toISOString() });
    await cleanup(layout);
    log.success("UPDATE", t("update.done"));
    restart(root);
    exit(0);
  } catch (error) {
    log.error("UPDATE", t("update.failed"), error);
    if (activated && backup) {
      log.warn("UPDATE", t("update.restoringBackup"));
      try {
        await replaceRuntime(backup, root);
        runner(npmExecutable(), ["ci"], root);
        log.info("UPDATE", t("update.backupRestored"));
      } catch (restoreError) {
        log.error("UPDATE", t("update.restoreFailed"), restoreError);
      }
    }
    await cleanup(layout).catch(() => undefined);
  }
}

export {
  MAX_ARCHIVE_BYTES,
  MAX_BACKUPS,
  MAX_ENTRY_BYTES,
  MAX_EXTRACTED_BYTES,
  MAX_ZIP_ENTRIES,
};

export const autoUpdateInternals = {
  downloadArchive,
  extractZip,
  getStagingRoot,
  validateStaging,
};
