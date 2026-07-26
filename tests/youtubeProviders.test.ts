import { createCipheriv, randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert";
import type { YtProviderContext } from "../src/helpers/youtube/types.js";
import {
  bronxyshostProvider,
  flvtoProvider,
  lukaProvider,
  nayanProvider,
  nevercapProvider,
  oceansaverProvider,
  savetubeProvider,
  ytconvertProvider,
} from "../src/helpers/youtube/providers/index.js";
import { SAVETUBE_KEY_DEFAULT } from "../src/helpers/youtube/providerHttp.js";

function sequenceFetch(responses: Response[]): typeof fetch {
  let index = 0;
  return (async () => {
    const response = responses[index++];
    if (!response) throw new Error("unexpected fetch");
    return response;
  }) as unknown as typeof fetch;
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
}

function context(...responses: Response[]): YtProviderContext {
  return { fetch: sequenceFetch(responses), sleep: async () => undefined };
}

describe("YouTube provider parsers", () => {
  it("parses Nayan", async () => {
    const result = await nayanProvider.resolve("video", "mp3", context(json({
      status: true,
      data: { audio: "https://cdn/audio", title: "title", channel: "author", quality: 128 },
    })));
    assert.equal(result.url, "https://cdn/audio");
    assert.equal(result.author, "author");
  });

  it("selects the best Flvto format", async () => {
    const result = await flvtoProvider.resolve("https://youtube.com/watch?v=abcdefghijk", "mp4", context(json({
      title: "title",
      formats: [
        { url: "https://cdn/360", qualityLabel: "360p", height: 360 },
        { url: "https://cdn/720", qualityLabel: "720p", height: 720 },
      ],
    })));
    assert.equal(result.url, "https://cdn/720");
    assert.equal(result.quality, "720p");
  });

  it("polls YtConvert until completed", async () => {
    const result = await ytconvertProvider.resolve("video", "mp3", context(
      json({ statusUrl: "https://status" }),
      json({ status: "completed", downloadUrl: "https://cdn/audio", title: "title" }),
    ));
    assert.equal(result.url, "https://cdn/audio");
  });

  it("polls Nevercap metadata", async () => {
    const result = await nevercapProvider.resolve("video", "mp4", context(
      json({ success: true, data: { id: 7 } }),
      json({ data: { fileMetaInfo: { fileUrl: "https://cdn/video", fileName: "name", fileType: "video/mp4" } } }),
    ));
    assert.equal(result.url, "https://cdn/video");
  });

  it("polls OceanSaver progress", async () => {
    const result = await oceansaverProvider.resolve("video", "mp3", context(
      json({ success: true, id: "job" }),
      json({ download_url: "https://cdn/audio", title: "title" }),
    ));
    assert.equal(result.url, "https://cdn/audio");
  });

  it("decrypts SaveTube metadata", async () => {
    const key = Buffer.from(SAVETUBE_KEY_DEFAULT, "hex");
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-128-cbc", key, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify({ key: "download-key", title: "title" })), cipher.final()]);
    const encoded = Buffer.concat([iv, encrypted]).toString("base64");
    const result = await savetubeProvider.resolve("video", "mp3", context(
      json({ cdn: "cdn.example" }),
      json({ data: encoded }),
      json({ data: { downloadUrl: "https://cdn/audio" } }),
    ));
    assert.equal(result.url, "https://cdn/audio");
    assert.equal(result.title, "title");
  });

  it("builds BronxysHost URL without fetching", async () => {
    const result = await bronxyshostProvider.resolve("query", "mp4", context());
    assert.match(result.url, /play_video/);
  });

  it("parses Luka SSE completion", async () => {
    const events = new Response('data: {"status":"complete","filePath":"/files/audio.mp3"}\n\n', {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    });
    const result = await lukaProvider.resolve("video", "mp3", context(
      json({ id: "video-id", title: "title" }),
      json({ jobID: "job" }),
      events,
    ));
    assert.match(result.url, /files\/audio\.mp3$/);
  });
});
