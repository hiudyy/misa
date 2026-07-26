import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { assertMediaSize, downloadToTemp } from "../src/media/downloadToTemp.js";
import { MEDIA_LIMITS } from "../src/media/types.js";
import { ErrorCode } from "../src/helpers/localizeError.js";

function fetchResponse(body: BodyInit | null, init?: ResponseInit): typeof fetch {
  return (async () => new Response(body, init)) as unknown as typeof fetch;
}

describe("downloadToTemp", () => {
  let directory: string;

  beforeEach(async () => {
    directory = path.join(tmpdir(), `misa-media-${randomUUID()}`);
    await fs.mkdir(directory, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(directory, { force: true, recursive: true });
  });

  it("streams chunks to disk and cleans up idempotently", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
        controller.close();
      },
    });
    const media = await downloadToTemp({
      url: "https://example.com/file.mp4",
      kind: "video",
      tempDir: directory,
      fetchImpl: fetchResponse(stream, { status: 200, headers: { "content-type": "video/mp4" } }),
    });
    assert.equal(media.size, 4);
    assert.deepEqual([...await fs.readFile(media.path)], [1, 2, 3, 4]);
    await media.cleanup();
    await fs.writeFile(media.path, "replacement");
    await media.cleanup();
    assert.equal(await fs.readFile(media.path, "utf8"), "replacement");
  });

  it("uses deterministic extensions for supported media types", async () => {
    const cases = [
      ["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/gif", ".gif"],
      ["audio/mpeg", ".mp3"], ["audio/mp4", ".m4a"], ["audio/ogg", ".ogg"],
      ["video/mp4", ".mp4"], ["video/webm", ".webm"], ["application/vnd.android.package-archive", ".apk"],
    ] as const;
    for (const [contentType, extension] of cases) {
      const media = await downloadToTemp({
        url: "https://example.com/no-extension",
        kind: contentType.startsWith("image") ? "image" : contentType.startsWith("audio") ? "audio" : contentType.startsWith("video") ? "video" : "document",
        tempDir: directory,
        fetchImpl: fetchResponse("x", { status: 200, headers: { "content-type": `${contentType}; charset=binary` } }),
      });
      assert.equal(path.extname(media.path), extension);
      await media.cleanup();
    }
    const fallback = await downloadToTemp({
      url: "https://example.com/file.unknownextension",
      kind: "document",
      tempDir: directory,
      fetchImpl: fetchResponse("x", { status: 200, headers: { "content-type": "application/octet-stream" } }),
    });
    assert.equal(path.extname(fallback.path), ".bin");
    await fallback.cleanup();
  });

  it("accepts exact limits and rejects every kind above its limit", () => {
    for (const [kind, limit] of Object.entries(MEDIA_LIMITS)) {
      assert.doesNotThrow(() => assertMediaSize({ toString: () => String(limit) }, kind as keyof typeof MEDIA_LIMITS));
      assert.throws(() => assertMediaSize(limit + 1, kind as keyof typeof MEDIA_LIMITS), new RegExp(ErrorCode.MEDIA_DOWNLOAD_TOO_LARGE));
    }
    assert.doesNotThrow(() => assertMediaSize(Number.NaN, "video"));
    assert.doesNotThrow(() => assertMediaSize(null, "video"));
  });

  it("rejects malformed and non-http URLs before fetch", async () => {
    let fetched = false;
    const fetchImpl = (async () => { fetched = true; return new Response("x"); }) as typeof fetch;
    await assert.rejects(downloadToTemp({ url: "not-a-url", kind: "video", fetchImpl, tempDir: directory }), /DOWNLOAD_INVALID_URL/);
    await assert.rejects(downloadToTemp({ url: "ftp://example.com/file", kind: "video", fetchImpl, tempDir: directory }), /DOWNLOAD_INVALID_URL/);
    assert.equal(fetched, false);
  });

  it("forwards headers, redirect policy and an abort signal", async () => {
    let received: RequestInit | undefined;
    const fetchImpl = (async (_url: URL | RequestInfo, init?: RequestInit) => {
      received = init;
      return new Response("x", { status: 200, headers: { "content-type": "video/mp4", "content-length": "1" } });
    }) as typeof fetch;
    const media = await downloadToTemp({
      url: "http://example.com/file.mp4",
      kind: "video",
      headers: { Authorization: "token" },
      maxBytes: 1,
      fetchImpl,
      tempDir: directory,
    });
    assert.deepEqual(received?.headers, { Authorization: "token" });
    assert.equal(received?.redirect, "follow");
    assert.ok(received?.signal instanceof AbortSignal);
    await media.cleanup();
  });

  it("uses the response content type as the effective media kind", async () => {
    const media = await downloadToTemp({
      url: "https://example.com/unknown",
      kind: "video",
      tempDir: directory,
      fetchImpl: fetchResponse("x", { status: 200, headers: { "content-type": "image/png" } }),
    });
    assert.equal(media.kind, "image");
    await media.cleanup();
  });

  it("rejects announced size before creating a file", async () => {
    await assert.rejects(downloadToTemp({
      url: "https://example.com/file.mp4",
      kind: "video",
      maxBytes: 3,
      tempDir: directory,
      fetchImpl: fetchResponse("1234", { status: 200, headers: { "content-length": "4", "content-type": "video/mp4" } }),
    }), new RegExp(ErrorCode.MEDIA_DOWNLOAD_TOO_LARGE));
    assert.deepEqual(await fs.readdir(directory), []);
  });

  it("aborts an unannounced stream above the real limit and removes partial file", async () => {
    await assert.rejects(downloadToTemp({
      url: "https://example.com/file.bin",
      kind: "document",
      maxBytes: 3,
      tempDir: directory,
      fetchImpl: fetchResponse(new Uint8Array([1, 2, 3, 4]), { status: 200 }),
    }), new RegExp(ErrorCode.MEDIA_DOWNLOAD_TOO_LARGE));
    assert.deepEqual(await fs.readdir(directory), []);
  });

  it("rejects textual responses and HTTP errors", async () => {
    await assert.rejects(downloadToTemp({
      url: "https://example.com/file",
      kind: "video",
      tempDir: directory,
      fetchImpl: fetchResponse("error", { status: 200, headers: { "content-type": "text/html" } }),
    }), new RegExp(ErrorCode.DOWNLOAD_FAILED));
    await assert.rejects(downloadToTemp({
      url: "https://example.com/file",
      kind: "video",
      tempDir: directory,
      fetchImpl: fetchResponse(null, { status: 503 }),
    }), /HTTP_503/);
    for (const contentType of ["application/json", "application/xml", "text/plain"]) {
      await assert.rejects(downloadToTemp({
        url: "https://example.com/file",
        kind: "document",
        tempDir: directory,
        fetchImpl: fetchResponse("x", { status: 200, headers: { "content-type": contentType } }),
      }), new RegExp(ErrorCode.DOWNLOAD_FAILED));
    }
  });

  it("rejects an empty response body", async () => {
    await assert.rejects(downloadToTemp({
      url: "https://example.com/file",
      kind: "video",
      tempDir: directory,
      fetchImpl: fetchResponse(new Uint8Array(0), { status: 200, headers: { "content-type": "video/mp4" } }),
    }), new RegExp(ErrorCode.DOWNLOAD_NO_DATA));
  });

  it("removes partial file when aborted", async () => {
    const controller = new AbortController();
    const stream = new ReadableStream({
      start(streamController) {
        streamController.enqueue(new Uint8Array([1]));
        setTimeout(() => {
          controller.abort(new Error(ErrorCode.MEDIA_ABORTED));
          streamController.enqueue(new Uint8Array([2]));
          streamController.close();
        }, 5);
      },
    });
    await assert.rejects(downloadToTemp({
      url: "https://example.com/file.mp4",
      kind: "video",
      tempDir: directory,
      signal: controller.signal,
      fetchImpl: fetchResponse(stream, { status: 200, headers: { "content-type": "video/mp4" } }),
    }), new RegExp(ErrorCode.MEDIA_ABORTED));
    assert.deepEqual(await fs.readdir(directory), []);
  });
});
