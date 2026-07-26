import { describe, it } from "node:test";
import assert from "node:assert";
import { checkDocs } from "../scripts/check-docs-lib.mjs";

describe("documentation", () => {
  it("contains all required localized documents and README links", async () => {
    assert.deepEqual(await checkDocs(process.cwd()), []);
  });
});
