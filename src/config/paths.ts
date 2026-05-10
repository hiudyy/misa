/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(process.cwd());
const SRC = path.dirname(fileURLToPath(import.meta.url));

export const paths = {
  root:     ROOT,
  dados:    path.join(ROOT, "dados"),
  auth:     path.join(ROOT, "dados", "misa-qr"),
  cache:    path.join(ROOT, "dados", "cache"),
  lidCache: path.join(ROOT, "dados", "cache", "lid.json"),
  grupos:   path.join(ROOT, "dados", "grupos"),
  fotos:    path.join(ROOT, "dados", "fotos"),
  assets:   path.join(SRC, "..", "assets"),
  commands: path.join(SRC, "..", "commands"),
  events:   path.join(SRC, "..", "events"),
};
