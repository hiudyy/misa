/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "../config/paths.js";

export async function hasValidSession(): Promise<boolean> {
  try {
    // Verifica se o diretório de autenticação existe
    const authDirExists = await fs.access(paths.auth).then(() => true).catch(() => false);
    if (!authDirExists) {
      return false;
    }

    // Verifica se o arquivo creds.json existe
    const credsPath = path.join(paths.auth, "creds.json");
    const credsExists = await fs.access(credsPath).then(() => true).catch(() => false);
    if (!credsExists) {
      return false;
    }

    // Verifica se o arquivo tem conteúdo válido
    const credsContent = await fs.readFile(credsPath, "utf8");
    const creds = JSON.parse(credsContent);

    // Verifica se tem as propriedades essenciais
    return !!(creds.me && creds.me.id);
  } catch {
    return false;
  }
}
