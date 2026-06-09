/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SRC, "..", "..");

export const paths = {
  root:     ROOT,
  dados:    path.join(ROOT, "dados"),
  owner:    path.join(ROOT, "dados", "owner"),
  ownerConfig: path.join(ROOT, "dados", "owner", "config.json"),
  auth:     path.join(ROOT, "dados", "misa-qr"),
  cache:    path.join(ROOT, "dados", "cache"),
  tmp:      path.join(ROOT, "dados", "tmp"),
  lidCache: path.join(ROOT, "dados", "cache", "lid.json"),
  grupos:   path.join(ROOT, "dados", "grupos"),
  fotos:    path.join(ROOT, "dados", "fotos"),
  assets:   path.join(SRC, "..", "assets"),
  commands: path.join(SRC, "..", "commands"),
  events:   path.join(SRC, "..", "events"),
};
