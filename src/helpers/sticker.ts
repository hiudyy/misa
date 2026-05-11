/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import webp from "node-webpmux";
import { WAMessage, WASocket } from "baileys";
import { paths } from "../config/paths.js";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

type StickerType = "image" | "video";
type StickerInput = Buffer | string | { url: string };

type SendStickerOptions = {
  sticker: StickerInput;
  type?: StickerType;
  packname?: string;
  author?: string;
  forceSquare?: boolean;
};

function detectImageExtension(buffer: Buffer): "png" | "jpg" | "webp" {
  if (buffer.length >= 12) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpg";
    if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "webp";
  }

  return "jpg";
}

async function ensureTmpDir(): Promise<string> {
  await fs.mkdir(paths.tmp, { recursive: true });
  return paths.tmp;
}

async function createTempFile(ext: string): Promise<string> {
  const dir = await ensureTmpDir();
  return path.join(dir, `${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`);
}

async function getBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao baixar mídia (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error("Download vazio");
  }

  return buffer;
}

async function resolveInputToBuffer(input: StickerInput): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input;

  if (typeof input === "string") {
    if (/^data:.*?;base64,/i.test(input)) {
      return Buffer.from(input.split(",")[1] ?? "", "base64");
    }

    if (/^https?:\/\//i.test(input)) {
      return getBuffer(input);
    }

    return fs.readFile(input);
  }

  if (typeof input === "object" && input !== null && "url" in input) {
    return getBuffer(input.url);
  }

  throw new Error("Entrada de sticker inválida");
}

async function convertToWebp(mediaBuffer: Buffer, isVideo = false, forceSquare = false): Promise<Buffer> {
  if (
    !isVideo &&
    mediaBuffer.subarray(0, 4).toString() === "RIFF" &&
    mediaBuffer.subarray(8, 12).toString() === "WEBP"
  ) {
    return mediaBuffer;
  }

  const inputPath = await createTempFile(isVideo ? "mp4" : detectImageExtension(mediaBuffer));
  await fs.writeFile(inputPath, mediaBuffer);

  const baseFilter = forceSquare
    ? "scale=320:320"
    : "scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba";
  const filters = isVideo ? `${baseFilter},fps=15` : baseFilter;
  const maxSize = 990000;
  const minQuality = isVideo ? 15 : 25;
  let quality = isVideo ? 45 : 75;
  let result = Buffer.alloc(0);

  try {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const outputPath = await createTempFile("webp");
      const outputOptions = [
        "-vf", filters,
        "-c:v", "libwebp",
        "-lossless", "0",
        "-compression_level", "6",
        "-preset", "default",
        ...(isVideo
          ? ["-q:v", String(quality), "-loop", "0", "-an", "-vsync", "0", "-t", "8"]
          : ["-q:v", String(quality)]),
      ];

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions(outputOptions)
          .format("webp")
          .on("end", () => resolve())
          .on("error", (error) => reject(error))
          .save(outputPath);
      });

      result = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(() => undefined);

      if (result.length === 0) {
        throw new Error("Conversão falhou: saída vazia");
      }

      if (result.length <= maxSize || quality <= minQuality) {
        break;
      }

      const reductionFactor = result.length / maxSize;
      if (reductionFactor > 1.5) {
        quality = Math.max(minQuality, Math.floor(quality * 0.6));
      } else if (reductionFactor > 1.2) {
        quality = Math.max(minQuality, Math.floor(quality * 0.75));
      } else {
        quality = Math.max(minQuality, quality - 10);
      }
    }
  } finally {
    await fs.unlink(inputPath).catch(() => undefined);
  }

  return result;
}

async function writeExif(webpBuffer: Buffer, metadata: { packname?: string; author?: string }): Promise<Buffer> {
  if (!metadata.packname && !metadata.author) {
    return webpBuffer;
  }

  try {
    const image = new webp.Image();
    await image.load(webpBuffer);

    const json = {
      "sticker-pack-id": "https://github.com/hiudyy",
      "sticker-pack-name": metadata.packname || "",
      "sticker-pack-publisher": metadata.author || "",
      emojis: ["✨"],
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00,
      0x00, 0x00,
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    image.exif = exif;

    return await image.save(null as never);
  } catch {
    return webpBuffer;
  }
}

export async function buildStickerBuffer(
  input: StickerInput,
  type: StickerType,
  options?: { packname?: string; author?: string; forceSquare?: boolean },
): Promise<Buffer> {
  const buffer = await resolveInputToBuffer(input);

  if (buffer.length < 10) {
    throw new Error("Buffer inválido/vazio");
  }

  const webpBuffer = await convertToWebp(buffer, type === "video", options?.forceSquare ?? false);
  return writeExif(webpBuffer, { packname: options?.packname, author: options?.author });
}

export async function sendSticker(
  misa: WASocket,
  jid: string,
  options: SendStickerOptions,
  extras?: { quoted?: WAMessage },
): Promise<Buffer> {
  const webpBuffer = await buildStickerBuffer(options.sticker, options.type ?? "image", options);
  await misa.sendMessage(jid, { sticker: webpBuffer }, { quoted: extras?.quoted });
  return webpBuffer;
}
