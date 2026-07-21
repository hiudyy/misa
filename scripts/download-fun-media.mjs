/**
 * Baixa mídias remotas de brincadeiras para src/assets/fun/
 * Uso: node scripts/download-fun-media.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const funDir = path.join(root, "src", "assets", "fun");
const sourcePath = path.join(funDir, "games.source.json");
const outManifest = path.join(funDir, "games.media.json");

function extFromUrl(url, contentType) {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "jpg";
  if (clean.endsWith(".png")) return "png";
  if (clean.endsWith(".webp")) return "webp";
  if (clean.endsWith(".gif")) return "gif";
  if (clean.endsWith(".mp4")) return "mp4";
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("mp4") || contentType?.includes("video")) return "mp4";
  return "jpg";
}

async function download(url, dest) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
    },
    signal: AbortSignal.timeout(60_000),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 100) throw new Error("arquivo muito pequeno");

  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buffer);
  return { bytes: buffer.length, contentType };
}

async function processSection(sectionName, items, folder) {
  const result = {};
  for (const [key, value] of Object.entries(items ?? {})) {
    const imageUrl = value?.image?.url;
    const videoUrl = value?.video?.url;
    const url = imageUrl || videoUrl;
    if (!url) continue;

    const kind = imageUrl ? "image" : "video";
    const provisional = path.join(funDir, folder, `${key}.bin`);

    try {
      process.stdout.write(`  ${sectionName}/${key}... `);
      const { contentType } = await download(url, provisional);
      const ext = extFromUrl(url, contentType);
      const finalPath = path.join(funDir, folder, `${key}.${ext}`);
      await fs.rename(provisional, finalPath);
      const rel = path.relative(funDir, finalPath).split(path.sep).join("/");
      result[key] = { [kind]: { path: rel } };
      console.log(`ok (${rel})`);
    } catch (error) {
      await fs.rm(provisional, { force: true }).catch(() => undefined);
      console.log(`FAIL: ${error instanceof Error ? error.message : error}`);
    }
  }
  return result;
}

const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));

console.log("Baixando games...");
const games = await processSection("games", source.games, "games");
console.log("Baixando ranks...");
const ranks = await processSection("ranks", source.ranks, "ranks");
console.log("Baixando games2...");
const games2 = await processSection("games2", source.games2, "games2");

const manifest = { games, ranks, games2 };
await fs.writeFile(outManifest, JSON.stringify(manifest, null, 2) + "\n");
console.log("\nManifesto salvo em", outManifest);
console.log(
  `OK: games=${Object.keys(games).length} ranks=${Object.keys(ranks).length} games2=${Object.keys(games2).length}`,
);
