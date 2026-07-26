import { describe, it } from "node:test";
import assert from "node:assert";
import { resolveBuildInfo } from "../src/version.js";

describe("build info", () => {
  it("prefers auto-update state commit", async () => {
    const info = await resolveBuildInfo({
      readFile: async () => JSON.stringify({ commit: "a".repeat(40) }) as never,
      env: { MISA_COMMIT_SHA: "b".repeat(40) },
      gitCommit: () => "ccccccc",
    });
    assert.equal(info.version, "1.1.0");
    assert.equal(info.commit, "a".repeat(12));
    assert.equal(info.schemaVersion, 2);
  });

  it("falls back to environment then git", async () => {
    const missing = async () => { throw new Error("missing"); };
    assert.equal((await resolveBuildInfo({ readFile: missing as never, env: { GITHUB_SHA: "D".repeat(40) }, gitCommit: () => "eeeeeee" })).commit, "d".repeat(12));
    assert.equal((await resolveBuildInfo({ readFile: missing as never, env: {}, gitCommit: () => "ABCDEF123456" })).commit, "abcdef123456");
  });

  it("returns unknown when no source is valid", async () => {
    const info = await resolveBuildInfo({
      readFile: (async () => "broken") as never,
      env: { MISA_COMMIT_SHA: "invalid" },
      gitCommit: () => { throw new Error("no git"); },
    });
    assert.equal(info.commit, "unknown");
  });
});
