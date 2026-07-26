import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { downloadYouTube, resolveYouTubeTarget } from "../src/helpers/youtubeDownload.js";
import { YouTubeProviderPool } from "../src/helpers/youtube/providerPool.js";
import type { YouTubeProvider } from "../src/helpers/youtube/types.js";

const provider: YouTubeProvider = {
  name: "test",
  async resolve() {
    return { url: "https://cdn.example/audio.mp3", title: "title", author: "author", ext: "mp3" };
  },
};

describe("YouTube download pipeline", () => {
  let directory: string;

  beforeEach(async () => {
    directory = path.join(tmpdir(), `misa-youtube-${randomUUID()}`);
    await fs.mkdir(directory, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(directory, { force: true, recursive: true });
  });

  it("returns a temporary file and metadata without buffering contract", async () => {
    const pool = new YouTubeProviderPool([provider], { retries: 1 });
    const result = await downloadYouTube("https://youtube.com/watch?v=abcdefghijk", "mp3", {
      pool,
      tempDir: directory,
      fetchImpl: (async () => new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 200,
        headers: { "content-type": "audio/mpeg" },
      })) as typeof fetch,
      transcode: async (input) => input,
    });
    assert.equal(result.success, true);
    assert.equal(result.title, "title");
    assert.equal(result.source, "test");
    assert.equal(result.media?.size, 4);
    assert.deepEqual([...await fs.readFile(result.media!.path)], [1, 2, 3, 4]);
    await result.media?.cleanup();
    assert.deepEqual(await fs.readdir(directory), []);
  });

  it("cleans downloaded input when transcoding fails", async () => {
    const pool = new YouTubeProviderPool([provider], { retries: 1 });
    const result = await downloadYouTube("https://youtube.com/watch?v=abcdefghijk", "mp3", {
      pool,
      tempDir: directory,
      fetchImpl: (async () => new Response("audio", { status: 200, headers: { "content-type": "audio/mpeg" } })) as typeof fetch,
      transcode: async () => { throw new Error("transcode failed"); },
    });
    assert.equal(result.success, false);
    assert.match(result.error ?? "", /transcode failed/);
    assert.deepEqual(await fs.readdir(directory), []);
  });

  it("canonicalizes direct URLs without performing a search", async () => {
    const result = await resolveYouTubeTarget("https://youtu.be/abcdefghijk");
    assert.deepEqual(result, { videoURL: "https://youtube.com/watch?v=abcdefghijk" });
  });
});
