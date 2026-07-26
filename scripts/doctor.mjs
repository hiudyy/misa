import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { runDoctor } from "./doctor-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await runDoctor(root, { ffmpegPath: ffmpegInstaller.path });

for (const message of result.checks) console.log(`[ok] ${message}`);
for (const message of result.warnings) console.warn(`[warn] ${message}`);
for (const message of result.errors) console.error(`[error] ${message}`);

if (!result.ok) process.exitCode = 1;
else console.log("Doctor completed successfully.");
