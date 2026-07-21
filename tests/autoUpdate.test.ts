import { describe, it } from "node:test";
import assert from "node:assert";
import path from "node:path";
import { MAX_BACKUPS, safeExtractPath, selectBackupsToDelete } from "../src/helpers/autoUpdate.js";

describe("safeExtractPath", () => {
  const destination = path.resolve("/tmp/misa-extract-test");

  it("allows nested paths inside destination", () => {
    const result = safeExtractPath(destination, "misa-main/src/index.ts");
    assert.ok(result.startsWith(destination));
  });

  it("rejects path traversal", () => {
    assert.throws(
      () => safeExtractPath(destination, "../outside.txt"),
      /UPDATE_ZIP_UNSAFE_ENTRY/i,
    );
  });

  it("rejects absolute-like traversal", () => {
    assert.throws(
      () => safeExtractPath(destination, "foo/../../etc/passwd"),
      /UPDATE_ZIP_UNSAFE_ENTRY/i,
    );
  });
});

describe("selectBackupsToDelete", () => {
  it("keeps up to MAX_BACKUPS", () => {
    const names = [
      "update-2024-01-01",
      "update-2024-01-02",
      "update-2024-01-03",
      "update-2024-01-04",
      "update-2024-01-05",
    ];
    assert.deepEqual(selectBackupsToDelete(names, MAX_BACKUPS), []);
  });

  it("deletes oldest when over the limit", () => {
    const names = [
      "update-2024-01-01",
      "update-2024-01-02",
      "update-2024-01-03",
      "update-2024-01-04",
      "update-2024-01-05",
      "update-2024-01-06",
    ];
    assert.deepEqual(selectBackupsToDelete(names, MAX_BACKUPS), ["update-2024-01-01"]);
  });

  it("ignores non-backup names", () => {
    const names = ["other", "update-2024-01-01"];
    assert.deepEqual(selectBackupsToDelete(names, MAX_BACKUPS), []);
  });
});
