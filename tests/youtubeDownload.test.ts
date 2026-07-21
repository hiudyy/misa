import { describe, it } from "node:test";
import assert from "node:assert";
import {
  formatYtDuration,
  getYouTubeVideoID,
  isYouTubeURL,
  sanitizeYtFileName,
} from "../src/helpers/youtubeDownload.js";

describe("YouTube helpers", () => {
  it("detects youtube URLs", () => {
    assert.equal(isYouTubeURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), true);
    assert.equal(isYouTubeURL("https://youtu.be/dQw4w9WgXcQ"), true);
    assert.equal(isYouTubeURL("https://tiktok.com/@x"), false);
  });

  it("extracts video ids", () => {
    assert.equal(getYouTubeVideoID("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.equal(getYouTubeVideoID("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.equal(getYouTubeVideoID("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.equal(getYouTubeVideoID("not a url"), "");
  });

  it("formats duration", () => {
    assert.equal(formatYtDuration(65), "1:05");
    assert.equal(formatYtDuration(3661), "1:01:01");
  });

  it("sanitizes filenames", () => {
    assert.equal(sanitizeYtFileName('bad/name:here'), "badnamehere");
    assert.equal(sanitizeYtFileName("   "), "media");
  });
});
