import { describe, it } from "node:test";
import assert from "node:assert";
import { findSimilarCommand } from "../src/helpers/unknownCommand.js";

describe("unknownCommand", () => {
  const commandNames = ["ping", "menu", "antilink", "bemvindo", "sticker"];

  it("finds a similar command above threshold", () => {
    const similar = findSimilarCommand("pingg", commandNames);
    assert.ok(similar);
    assert.strictEqual(similar?.name, "ping");
    assert.ok((similar?.percentage ?? 0) >= 35);
  });

  it("returns null when similarity is too low", () => {
    const similar = findSimilarCommand("zzzzzz", commandNames);
    assert.strictEqual(similar, null);
  });

  it("returns 100% for identical strings", () => {
    const similar = findSimilarCommand("ping", commandNames);
    assert.strictEqual(similar?.name, "ping");
    assert.strictEqual(similar?.percentage, 100);
  });

  it("returns a low but valid match for partial input", () => {
    const similar = findSimilarCommand("men", commandNames);
    assert.ok(similar);
    assert.ok((similar?.percentage ?? 0) > 0);
  });
});
