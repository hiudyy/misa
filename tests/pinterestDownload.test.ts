import { describe, it } from "node:test";
import assert from "node:assert";
import { extractPinID, isValidPinURL } from "../src/helpers/pinterestDownload.js";

describe("isValidPinURL", () => {
  it("accepts pinterest pin URLs", () => {
    assert.equal(isValidPinURL("https://br.pinterest.com/pin/1234567890/"), true);
    assert.equal(isValidPinURL("https://www.pinterest.com/pin/1234567890"), true);
  });

  it("accepts pin.it short links", () => {
    assert.equal(isValidPinURL("https://pin.it/AbCdEfG"), true);
  });

  it("rejects non-pin URLs", () => {
    assert.equal(isValidPinURL("https://pinterest.com/username/"), false);
    assert.equal(isValidPinURL("wallpaper 4k"), false);
  });
});

describe("extractPinID", () => {
  it("extracts numeric pin id", () => {
    assert.equal(extractPinID("https://br.pinterest.com/pin/1234567890/"), "1234567890");
  });

  it("returns empty for invalid paths", () => {
    assert.equal(extractPinID("https://pinterest.com/user/board/"), "");
  });
});
