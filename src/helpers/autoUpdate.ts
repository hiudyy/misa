/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { inflateRawSync } from "node:zlib";
import { paths } from "../config/paths.js";
import { log } from "../logger.js";
import { getGlobalLocale, createTranslator } from "../i18n/index.js";

const REPO_ZIP = "https://github.com/hiudyy/misa/archive/refs/heads/main.zip";
const ZIP_PATH = path.join(paths.dados, "update.zip");
const EXTRACT_PATH = path.join(paths.dados, "update-tmp");
const BACKUPS_DIR = path.join(paths.dados, "backups");
const MAX_BACKUPS = 5;

async function cleanup(): Promise<void> {
  await fs.rm(ZIP_PATH, { force: true });
  await fs.rm(EXTRACT_PATH, { force: true, recursive: true });
}

async function cleanupBackup(backupDir: string): Promise<void> {
  await fs.rm(backupDir, { force: true, recursive: true });
}

async function cleanupOldBackups(): Promise<void> {
  try {
    const entries = await fs.readdir(BACKUPS_DIR, { withFileTypes: true });
    const backupDirs = entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("update-"))
      .map((entry) => entry.name);

    const toDelete = selectBackupsToDelete(backupDirs, MAX_BACKUPS);
    for (const oldest of toDelete) {
      await fs.rm(path.join(BACKUPS_DIR, oldest), { force: true, recursive: true });
    }
  } catch {
    // diretório de backups pode não existir ainda
  }
}

async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(BACKUPS_DIR, `update-${timestamp}`);

  await fs.mkdir(backupDir, { recursive: true });

  const srcPath = path.join(paths.root, "src");
  const packagePath = path.join(paths.root, "package.json");
  const srcBackupPath = path.join(backupDir, "src");
  const packageBackupPath = path.join(backupDir, "package.json");

  try {
    await fs.cp(srcPath, srcBackupPath, { recursive: true });
  } catch {
    // src pode não existir em cenários incomuns, ignora
  }

  try {
    const packageContent = await fs.readFile(packagePath, "utf8");
    await fs.writeFile(packageBackupPath, packageContent, "utf8");
  } catch {
    // package.json pode não existir, ignora
  }

  await cleanupOldBackups();
  return backupDir;
}

async function restoreBackup(
  backupDir: string,
  t: (key: string, vars?: Record<string, string>) => string,
): Promise<void> {
  const srcBackupPath = path.join(backupDir, "src");
  const packageBackupPath = path.join(backupDir, "package.json");
  const srcPath = path.join(paths.root, "src");
  const packagePath = path.join(paths.root, "package.json");

  try {
    await fs.rm(srcPath, { force: true, recursive: true });
    await fs.cp(srcBackupPath, srcPath, { recursive: true });
  } catch (error) {
    log.error("UPDATE", t("update.restoreSrcFailed"), error);
  }

  try {
    const packageContent = await fs.readFile(packageBackupPath, "utf8");
    await fs.writeFile(packagePath, packageContent, "utf8");
  } catch (error) {
    log.error("UPDATE", t("update.restorePackageFailed"), error);
  }
}

async function downloadFile(url: string, destination: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`UPDATE_DOWNLOAD_HTTP_${response.status}`);
  }

  const data = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, data);
}

function readUInt64LE(buffer: Buffer, offset: number): number {
  const value = buffer.readBigUInt64LE(offset);

  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("UPDATE_ZIP_TOO_LARGE");
  }

  return Number(value);
}

function findEndOfCentralDirectory(zip: Buffer): number {
  const signature = 0x06054b50;
  const maxCommentSize = 0xffff;
  const minOffset = Math.max(0, zip.length - maxCommentSize - 22);

  for (let offset = zip.length - 22; offset >= minOffset; offset--) {
    if (zip.readUInt32LE(offset) === signature) return offset;
  }

  throw new Error("UPDATE_ZIP_EOCD_NOT_FOUND");
}

function getCentralDirectory(zip: Buffer): { offset: number; entries: number } {
  const eocdOffset = findEndOfCentralDirectory(zip);
  const entryCount = zip.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = zip.readUInt32LE(eocdOffset + 16);

  if (entryCount !== 0xffff && centralDirectoryOffset !== 0xffffffff) {
    return { offset: centralDirectoryOffset, entries: entryCount };
  }

  const locatorOffset = eocdOffset - 20;
  if (locatorOffset < 0 || zip.readUInt32LE(locatorOffset) !== 0x07064b50) {
    throw new Error("UPDATE_ZIP64_LOCATOR_INVALID");
  }

  const zip64EocdOffset = readUInt64LE(zip, locatorOffset + 8);
  if (zip.readUInt32LE(zip64EocdOffset) !== 0x06064b50) {
    throw new Error("UPDATE_ZIP64_EOCD_INVALID");
  }

  return {
    offset: readUInt64LE(zip, zip64EocdOffset + 48),
    entries: readUInt64LE(zip, zip64EocdOffset + 32),
  };
}

function safeExtractPath(destination: string, fileName: string): string {
  const normalizedName = fileName.replace(/\\/g, "/");
  const targetPath = path.resolve(destination, normalizedName);
  const destinationPath = path.resolve(destination);

  if (targetPath !== destinationPath && !targetPath.startsWith(`${destinationPath}${path.sep}`)) {
    throw new Error(`UPDATE_ZIP_UNSAFE_ENTRY:${fileName}`);
  }

  return targetPath;
}

/** Retorna nomes de backups antigos a remover, mantendo no máximo `maxBackups`. */
export function selectBackupsToDelete(backupNames: string[], maxBackups: number): string[] {
  const sorted = [...backupNames].filter((name) => name.startsWith("update-")).sort();
  if (sorted.length <= maxBackups) return [];
  return sorted.slice(0, sorted.length - maxBackups);
}

export { safeExtractPath, MAX_BACKUPS };

async function extractZip(zipPath: string, destination: string): Promise<void> {
  const zip = await fs.readFile(zipPath);
  const centralDirectory = getCentralDirectory(zip);
  let offset = centralDirectory.offset;

  await fs.mkdir(destination, { recursive: true });

  for (let entryIndex = 0; entryIndex < centralDirectory.entries; entryIndex++) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("UPDATE_ZIP_CENTRAL_CORRUPT");
    }

    const compressionMethod = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const fileNameSize = zip.readUInt16LE(offset + 28);
    const extraSize = zip.readUInt16LE(offset + 30);
    const commentSize = zip.readUInt16LE(offset + 32);
    const localHeaderOffset = zip.readUInt32LE(offset + 42);
    const fileName = zip.toString("utf8", offset + 46, offset + 46 + fileNameSize);

    offset += 46 + fileNameSize + extraSize + commentSize;

    const targetPath = safeExtractPath(destination, fileName);
    if (fileName.endsWith("/")) {
      await fs.mkdir(targetPath, { recursive: true });
      continue;
    }

    if (zip.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`UPDATE_ZIP_LOCAL_HEADER_MISSING:${fileName}`);
    }

    const localFileNameSize = zip.readUInt16LE(localHeaderOffset + 26);
    const localExtraSize = zip.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localFileNameSize + localExtraSize;
    const compressedData = zip.subarray(dataOffset, dataOffset + compressedSize);
    let fileData: Buffer;

    if (compressionMethod === 0) {
      fileData = compressedData;
    } else if (compressionMethod === 8) {
      fileData = inflateRawSync(compressedData);
    } else {
      throw new Error(`UPDATE_ZIP_COMPRESSION_UNSUPPORTED:${compressionMethod}:${fileName}`);
    }

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, fileData);
  }
}

export async function runAutoUpdate(): Promise<void> {
  const globalLocale = await getGlobalLocale();
  const t = createTranslator(globalLocale);
  const packagePath = path.join(paths.root, "package.json");
  const packageTmpPath = path.join(paths.root, "package.json.tmp");
  let packageBackup: string | null = null;
  let backupDir: string | null = null;

  log.info("UPDATE", t("update.checking"));

  try {
    try {
      packageBackup = await fs.readFile(packagePath, "utf8");
    } catch {
      packageBackup = null;
    }

    log.info("UPDATE", t("update.creatingBackup"));
    backupDir = await createBackup();
    log.success("UPDATE", t("update.backupCreated", { path: backupDir }));

    await cleanup();
    await fs.mkdir(EXTRACT_PATH, { recursive: true });

    log.info("UPDATE", t("update.downloading"));
    await downloadFile(REPO_ZIP, ZIP_PATH);

    log.info("UPDATE", t("update.extracting"));
    await extractZip(ZIP_PATH, EXTRACT_PATH);

    const extracted = path.join(EXTRACT_PATH, "misa-main");

    const srcDestClean = path.join(paths.root, "src");
    const configPath = path.join(srcDestClean, "config.json");
    let configBackup: string | null = null;

    try {
      configBackup = await fs.readFile(configPath, "utf8");
    } catch {
      // config.json não existe, ignora
    }

    await fs.rm(srcDestClean, { force: true, recursive: true });
    await fs.cp(path.join(extracted, "src"), srcDestClean, { recursive: true });

    if (configBackup !== null) {
      await fs.writeFile(configPath, configBackup, "utf8");
    }

    const nextPackage = await fs.readFile(path.join(extracted, "package.json"), "utf8");
    await fs.writeFile(packageTmpPath, nextPackage, "utf8");
    await fs.rename(packageTmpPath, packagePath);

    log.info("UPDATE", t("update.installingDeps"));
    execSync("npm install --prefer-offline", { cwd: paths.root, stdio: "inherit" });

    log.success("UPDATE", t("update.done"));

    await cleanup();

    process.on("exit", () => {
      spawnSync("npm", ["run", "start:fast", "--", "--no-update"], { cwd: paths.root, stdio: "inherit", shell: true });
    });

    process.exit(0);
  } catch (error) {
    log.error("UPDATE", t("update.failed"), error);

    if (backupDir) {
      log.warn("UPDATE", t("update.restoringBackup"));
      await restoreBackup(backupDir, t);
      log.info("UPDATE", t("update.backupRestored"));
    }

    await fs.rm(packageTmpPath, { force: true });
    if (packageBackup !== null) {
      try {
        await fs.writeFile(packagePath, packageBackup, "utf8");
      } catch (restoreError) {
        log.error("UPDATE", t("update.restoreFailed"), restoreError);
      }
    }
    await cleanup();
  }
}
