import { describe, it } from "node:test";
import assert from "node:assert";
import { downloadInstagram } from "../src/helpers/instagramDownload.js";
import { downloadTiktok, searchTiktok } from "../src/helpers/tiktokDownload.js";
import { downloadPinterest, searchPinterest } from "../src/helpers/pinterestDownload.js";
import { ErrorCode } from "../src/helpers/localizeError.js";

function sequenceFetch(responses: Response[], inspect?: (input: string | URL | Request, init?: RequestInit) => void): typeof fetch {
  let index = 0;
  return (async (input: string | URL | Request, init?: RequestInit) => {
    inspect?.(input, init);
    const response = responses[index++];
    if (!response) throw new Error("unexpected fetch");
    return response;
  }) as typeof fetch;
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
}

describe("social download resolvers", () => {
  it("resolves Instagram media and propagates the signal", async () => {
    const controller = new AbortController();
    const seenSignals: Array<AbortSignal | null | undefined> = [];
    const result = await downloadInstagram(`https://instagram.com/p/test-${Date.now()}`, {
      signal: controller.signal,
      fetchImpl: sequenceFetch([
        json({ data: [{ url: "https://cdn.example/image.jpg" }] }),
        new Response(null, { status: 200, headers: { "content-type": "image/jpeg" } }),
      ], (_input, init) => seenSignals.push(init?.signal)),
    });
    assert.deepEqual(result, { medias: [{ type: "image", url: "https://cdn.example/image.jpg" }], count: 1 });
    assert.ok(seenSignals.every((signal) => signal instanceof AbortSignal));
  });

  it("deduplicates Instagram media, falls back to video and caches", async () => {
    const url = `https://instagram.com/p/cache-${Date.now()}`;
    const first = await downloadInstagram(url, {
      fetchImpl: sequenceFetch([
        json({ data: [{ url: "https://cdn.example/media" }, { url: "https://cdn.example/media" }] }),
        new Response(null, { status: 500 }),
      ]),
    });
    assert.deepEqual(first, { medias: [{ type: "video", url: "https://cdn.example/media" }], count: 1 });
    const cached = await downloadInstagram(url, { fetchImpl: (async () => { throw new Error("cache miss"); }) as typeof fetch });
    assert.deepEqual(cached, first);
  });

  it("rejects empty and failed Instagram responses", async () => {
    await assert.rejects(downloadInstagram(`https://instagram.com/p/empty-${Date.now()}`, {
      fetchImpl: sequenceFetch([json({ data: [] })]),
    }), new RegExp(ErrorCode.DOWNLOAD_NOT_FOUND));
    await assert.rejects(downloadInstagram(`https://instagram.com/p/fail-${Date.now()}`, {
      fetchImpl: sequenceFetch([new Response(null, { status: 503 })]),
    }), /HTTP 503/);
  });

  it("resolves TikTok direct and search results", async () => {
    const direct = await downloadTiktok(`https://www.tiktok.com/@user/video/${Date.now()}`, {
      fetchImpl: sequenceFetch([json({ code: 0, data: { play: "https://cdn/video.mp4", title: "title", music_info: { play: "https://cdn/audio.mp3" } } })]),
    });
    assert.equal(direct.urls[0], "https://cdn/video.mp4");
    const searched = await searchTiktok(`query-${Date.now()}`, {
      fetchImpl: sequenceFetch([json({ code: 0, data: { videos: [{ play: "https://cdn/result.mp4", title: "result" }] } })]),
    });
    assert.equal(searched.title, "result");
  });

  it("resolves TikTok slideshows and uses cache", async () => {
    const url = `https://www.tiktok.com/@user/video/${Date.now()}1`;
    const slideshow = await downloadTiktok(url, {
      fetchImpl: sequenceFetch([json({ code: 0, data: { images: ["https://cdn/one.jpg", "https://cdn/two.jpg"], title: "slides" } })]),
    });
    assert.equal(slideshow.type, "image");
    assert.equal(slideshow.urls.length, 2);
    assert.deepEqual(await downloadTiktok(url, { fetchImpl: (async () => { throw new Error("cache miss"); }) as typeof fetch }), slideshow);
  });

  it("rejects invalid TikTok API data", async () => {
    await assert.rejects(downloadTiktok(`https://www.tiktok.com/@user/video/${Date.now()}2`, {
      fetchImpl: sequenceFetch([json({ code: 1, data: {} })]),
    }), new RegExp(ErrorCode.DOWNLOAD_NO_DATA));
    await assert.rejects(searchTiktok(`empty-${Date.now()}`, {
      fetchImpl: sequenceFetch([json({ code: 0, data: { videos: [] } })]),
    }), new RegExp(ErrorCode.DOWNLOAD_NOT_FOUND));
  });

  it("resolves Pinterest search and direct image", async () => {
    const query = `query-${Date.now()}`;
    const images = await searchPinterest(query, {
      fetchImpl: sequenceFetch([new Response('"https://i.pinimg.com/236x/a.jpg" "https://i.pinimg.com/236x/a.jpg"', { status: 200 })]),
    });
    assert.deepEqual(images, ["https://i.pinimg.com/736x/a.jpg"]);
    const direct = await downloadPinterest("https://pinterest.com/pin/123456789", {
      fetchImpl: sequenceFetch([json({ resource_response: { data: { images: { orig: { url: "https://cdn/image.jpg" } } } } })]),
    });
    assert.deepEqual(direct, { url: "https://cdn/image.jpg", type: "image" });
  });

  it("resolves Pinterest short redirects, videos and cache", async () => {
    const short = `https://pin.it/cache${Date.now()}`;
    const fetchImpl = sequenceFetch([
      new Response(null, { status: 302, headers: { location: "https://pinterest.com/pin/987654321" } }),
      json({ resource_response: { data: { videos: { video_list: { V_720P: { url: "https://cdn/video.mp4" } } } } } }),
    ]);
    const result = await downloadPinterest(short, { fetchImpl });
    assert.deepEqual(result, { url: "https://cdn/video.mp4", type: "video" });
    assert.deepEqual(await downloadPinterest(short, { fetchImpl: (async () => { throw new Error("cache miss"); }) as typeof fetch }), result);
  });

  it("chooses the best Pinterest image and rejects missing media", async () => {
    const image = await downloadPinterest("https://pinterest.com/pin/222222222", {
      fetchImpl: sequenceFetch([json({ resource_response: { data: { images: {
        "236x": { url: "https://cdn/236.jpg" },
        "736x": { url: "https://cdn/736.jpg" },
      } } } })]),
    });
    assert.equal(image.url, "https://cdn/736.jpg");
    await assert.rejects(downloadPinterest("https://pinterest.com/pin/333333333", {
      fetchImpl: sequenceFetch([json({ resource_response: { data: {} } })]),
    }), new RegExp(ErrorCode.DOWNLOAD_NO_MEDIA));
    await assert.rejects(downloadPinterest("https://pinterest.com/not-a-pin", {
      fetchImpl: sequenceFetch([]),
    }), new RegExp(ErrorCode.DOWNLOAD_PIN_ID));
  });

  it("caches Pinterest searches and handles HTTP errors", async () => {
    const query = `cache-${Date.now()}`;
    const first = await searchPinterest(query, {
      fetchImpl: sequenceFetch([new Response('"https://i.pinimg.com/236x/cached.jpg"', { status: 200 })]),
    });
    assert.deepEqual(await searchPinterest(query, { fetchImpl: (async () => { throw new Error("cache miss"); }) as typeof fetch }), first);
    await assert.rejects(searchPinterest(`failed-${Date.now()}`, {
      fetchImpl: sequenceFetch([new Response(null, { status: 500 })]),
    }), /HTTP 500/);
  });
});
