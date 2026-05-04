/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { paths } from "../config/paths.js";
import { log } from "../logger.js";

const REPO_ZIP = "https://github.com/hiudyy/misa/archive/refs/heads/main.zip";
const ZIP_PATH = path.join(paths.dados, "update.zip");
const EXTRACT_PATH = path.join(paths.dados, "update-tmp");

async function cleanup(): Promise<void> {
  await fs.rm(ZIP_PATH, { force: true });
  await fs.rm(EXTRACT_PATH, { force: true, recursive: true });
}

export async function runAutoUpdate(): Promise<void> {
  log.info("UPDATE", "Verificando atualizações...");

  try {
    await cleanup();
    await fs.mkdir(EXTRACT_PATH, { recursive: true });

    log.info("UPDATE", "Baixando atualização...");
    execSync(`curl -L --silent --show-error -o "${ZIP_PATH}" "${REPO_ZIP}"`, { stdio: "pipe" });

    log.info("UPDATE", "Extraindo...");
    execSync(`unzip -q "${ZIP_PATH}" -d "${EXTRACT_PATH}"`);

    const extracted = path.join(EXTRACT_PATH, "misa-main");

    const srcDestClean = path.join(paths.root, "src");

    // Salva o config.json antes de substituir o src/
    const configPath = path.join(srcDestClean, "config.json");
    let configBackup: string | null = null;
    try {
      configBackup = await fs.readFile(configPath, "utf8");
    } catch {
      // config.json não existe, ignora
    }

    await fs.rm(srcDestClean, { force: true, recursive: true });
    await fs.cp(path.join(extracted, "src"), srcDestClean, { recursive: true });

    // Restaura o config.json
    if (configBackup !== null) {
      await fs.writeFile(configPath, configBackup, "utf8");
    }

    await fs.copyFile(path.join(extracted, "package.json"), path.join(paths.root, "package.json"));

    log.info("UPDATE", "Instalando dependências...");
    execSync("npm install --prefer-offline", { cwd: paths.root, stdio: "inherit" });

    log.success("UPDATE", "Atualização concluída! Reiniciando...");

    await cleanup();

    process.on("exit", () => {
      spawnSync("npm", ["run", "start:fast", "--", "--no-update"], { cwd: paths.root, stdio: "inherit", shell: true });
    });

    process.exit(0);
  } catch (error) {
    log.error("UPDATE", "Falha na atualização. Continuando com a versão atual.", error);
    await cleanup();
  }
}
