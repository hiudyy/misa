/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { paths } from "../config/paths.js";

export async function listStoredGroupIds(): Promise<string[]> {
  try {
    const files = await fs.readdir(paths.grupos);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => `${path.basename(file, ".json")}@g.us`);
  } catch {
    return [];
  }
}
