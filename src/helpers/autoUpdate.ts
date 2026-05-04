/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { get } from "node:https";
import { paths } from "../config/paths.js";
import { log } from "../logger.js";

const REPO_ZIP = "https://github.com/hiudyy/misa/archive/refs/heads/main.zip";
const ZIP_PATH = path.join(paths.dados, "update.zip");
const EXTRACT_PATH = path.join(paths.dados, "update-tmp");

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const request = (u: string) => {
      get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          request(res.headers.location!);
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      }).on("error", reject);
    };
    request(url);
  });
}

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
    await download(REPO_ZIP, ZIP_PATH);

    log.info("UPDATE", "Extraindo...");
    execSync(`unzip -q "${ZIP_PATH}" -d "${EXTRACT_PATH}"`);

    // O zip extrai numa pasta misa-main/
    const extracted = path.join(EXTRACT_PATH, "misa-main");

    // Substitui src/
    const srcDest = paths.commands.replace(/\/commands$/, "").replace(/\/src\/.*/, "").replace(/src$/, "").trimEnd() + "src";
    const srcDestClean = path.join(paths.root, "src");
    await fs.rm(srcDestClean, { force: true, recursive: true });
    await fs.cp(path.join(extracted, "src"), srcDestClean, { recursive: true });

    // Substitui package.json mas mantém o config.json
    await fs.copyFile(path.join(extracted, "package.json"), path.join(paths.root, "package.json"));

    log.info("UPDATE", "Instalando dependências...");
    execSync("npm install --prefer-offline", { cwd: paths.root, stdio: "inherit" });

    log.success("UPDATE", "Atualização concluída! Reiniciando...");

    await cleanup();

    // Reinicia o processo
    process.on("exit", () => {
      spawnSync(process.argv[0], process.argv.slice(1), { stdio: "inherit" });
    });

    process.exit(0);
  } catch (error) {
    log.error("UPDATE", "Falha na atualização. Continuando com a versão atual.", error);
    await cleanup();
  }
}
