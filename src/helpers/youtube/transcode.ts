/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { paths } from "../../config/paths.js";
import { ErrorCode } from "../localizeError.js";
import { assertMediaSize } from "../../media/downloadToTemp.js";
import { ffmpegLimiter } from "../../media/ffmpegLimiter.js";
import type { TempMedia } from "../../media/types.js";
import type { YtFormat } from "./types.js";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

function compatible(media: TempMedia, format: YtFormat): boolean {
  if (format === "mp3") return media.contentType === "audio/mpeg" || path.extname(media.path).toLowerCase() === ".mp3";
  return media.contentType === "video/mp4" || path.extname(media.path).toLowerCase() === ".mp4";
}

async function runFfmpeg(input: string, output: string, format: YtFormat, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const command = ffmpeg(input).output(output);
    if (format === "mp3") {
      command.noVideo().audioCodec("libmp3lame").audioBitrate("128k").audioFrequency(44_100).audioChannels(2);
    } else {
      command
        .videoCodec("libx264")
        .outputOptions(["-preset", "fast", "-crf", "28", "-movflags", "+faststart", "-pix_fmt", "yuv420p"])
        .audioCodec("aac")
        .audioBitrate("128k")
        .audioFrequency(44_100)
        .audioChannels(2);
    }
    const onAbort = () => {
      command.kill("SIGKILL");
      reject(signal?.reason ?? new Error(ErrorCode.MEDIA_ABORTED));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    command
      .on("end", () => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      })
      .on("error", (error) => {
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      })
      .run();
  });
}

export async function transcodeYouTubeMedia(input: TempMedia, format: YtFormat, signal?: AbortSignal): Promise<TempMedia> {
  const outputPath = path.join(paths.tmp, `yt_${randomUUID()}.${format}`);
  await fs.mkdir(paths.tmp, { recursive: true });
  try {
    await ffmpegLimiter.run(() => runFfmpeg(input.path, outputPath, format, signal), signal);
    const stat = await fs.stat(outputPath);
    assertMediaSize(stat.size, format === "mp3" ? "audio" : "video");
    if (stat.size < 1_000) throw new Error(ErrorCode.STICKER_CONVERSION_FAILED);
    await input.cleanup();
    let cleaned = false;
    return {
      path: outputPath,
      size: stat.size,
      contentType: format === "mp3" ? "audio/mpeg" : "video/mp4",
      kind: format === "mp3" ? "audio" : "video",
      async cleanup() {
        if (cleaned) return;
        cleaned = true;
        await fs.rm(outputPath, { force: true });
      },
    };
  } catch (error) {
    await fs.rm(outputPath, { force: true }).catch(() => undefined);
    if (signal?.aborted) {
      await input.cleanup();
      throw signal.reason ?? error;
    }
    if (compatible(input, format)) return input;
    await input.cleanup();
    throw error;
  }
}
