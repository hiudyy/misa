import { describe, it } from "node:test";
import assert from "node:assert";
import { isValidInstagramURL } from "../src/helpers/instagramDownload.js";

describe("isValidInstagramURL", () => {
  it("accepts post URLs", () => {
    assert.equal(isValidInstagramURL("https://www.instagram.com/p/ABC123xyz/"), true);
  });

  it("accepts reel URLs", () => {
    assert.equal(isValidInstagramURL("https://instagram.com/reel/ABC123xyz"), true);
  });

  it("accepts reels and tv URLs", () => {
    assert.equal(isValidInstagramURL("https://www.instagram.com/reels/ABC123xyz/"), true);
    assert.equal(isValidInstagramURL("https://www.instagram.com/tv/ABC123xyz/"), true);
  });

  it("rejects non-instagram URLs", () => {
    assert.equal(isValidInstagramURL("https://tiktok.com/@user/video/1"), false);
    assert.equal(isValidInstagramURL("not a url"), false);
  });

  it("rejects profile URLs", () => {
    assert.equal(isValidInstagramURL("https://www.instagram.com/username/"), false);
  });
});
