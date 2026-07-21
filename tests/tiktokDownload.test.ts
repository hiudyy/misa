import { describe, it } from "node:test";
import assert from "node:assert";
import { isValidTiktokURL } from "../src/helpers/tiktokDownload.js";

describe("isValidTiktokURL", () => {
  it("accepts standard video URLs", () => {
    assert.equal(isValidTiktokURL("https://www.tiktok.com/@user/video/1234567890"), true);
  });

  it("accepts short vm/vt links", () => {
    assert.equal(isValidTiktokURL("https://vm.tiktok.com/ZMabcdef/"), true);
    assert.equal(isValidTiktokURL("https://vt.tiktok.com/ZSabcdef/"), true);
  });

  it("accepts www.tiktok.com root links", () => {
    assert.equal(isValidTiktokURL("https://www.tiktok.com/"), true);
  });

  it("rejects non-tiktok URLs", () => {
    assert.equal(isValidTiktokURL("https://instagram.com/p/abc"), false);
    assert.equal(isValidTiktokURL("dança viral"), false);
  });
});
