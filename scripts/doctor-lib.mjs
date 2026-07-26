import { constants, promises as fs } from "node:fs";
import path from "node:path";

const REQUIRED_LOCALES = ["ar", "bn", "de", "en", "es", "fr", "hi", "id", "pt", "tr", "ur"];

async function accessible(filePath, mode = constants.R_OK) {
  try {
    await fs.access(filePath, mode);
    return true;
  } catch {
    return false;
  }
}

export async function runDoctor(root, options = {}) {
  const errors = [];
  const warnings = [];
  const checks = [];
  const nodeVersion = options.nodeVersion ?? process.versions.node;
  const major = Number(nodeVersion.split(".")[0]);
  if (!Number.isInteger(major) || major < 22) errors.push(`Node.js >=22 required; found ${nodeVersion}`);
  else checks.push(`Node.js ${nodeVersion}`);

  for (const file of ["package.json", "package-lock.json"]) {
    if (await accessible(path.join(root, file))) checks.push(`${file} readable`);
    else errors.push(`${file} missing or unreadable`);
  }

  const dataDir = path.join(root, "dados");
  const probe = path.join(dataDir, `.doctor-${process.pid}.tmp`);
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(probe, "ok", { mode: 0o600 });
    await fs.rm(probe, { force: true });
    checks.push("dados/ writable");
  } catch (error) {
    errors.push(`dados/ is not writable: ${String(error)}`);
  }

  const configPath = path.join(dataDir, "config.json");
  if (await accessible(configPath)) {
    try {
      const config = JSON.parse(await fs.readFile(configPath, "utf8"));
      if (typeof config.schemaVersion === "number" && config.schemaVersion > 2) {
        errors.push(`config schema ${config.schemaVersion} is newer than supported schema 2`);
      } else checks.push(`config schema ${config.schemaVersion ?? 0} readable`);
    } catch {
      errors.push("dados/config.json is invalid JSON");
    }
  } else {
    warnings.push("dados/config.json not created yet; run npm start");
  }

  const distFiles = [
    path.join(root, "dist", "index.js"),
    path.join(root, "dist", "assets", "menu.jpeg"),
    ...REQUIRED_LOCALES.map((locale) => path.join(root, "dist", "i18n", `${locale}.json`)),
  ];
  const missingDist = [];
  for (const file of distFiles) if (!(await accessible(file))) missingDist.push(path.relative(root, file));
  if (missingDist.length > 0) errors.push(`build incomplete: ${missingDist.join(", ")}`);
  else checks.push("dist build, assets and 11 locales present");

  const ffmpegPath = options.ffmpegPath;
  if (!ffmpegPath) warnings.push("FFmpeg path was not provided to doctor");
  else if (await accessible(ffmpegPath, constants.X_OK)) checks.push("FFmpeg executable available");
  else errors.push(`FFmpeg executable missing or not executable: ${ffmpegPath}`);

  return { ok: errors.length === 0, checks, warnings, errors };
}
