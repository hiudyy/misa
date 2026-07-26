import { describe, it } from "node:test";
import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import {
  MAX_ARCHIVE_BYTES,
  MAX_BACKUPS,
  MAX_ENTRY_BYTES,
  approveNpmInstallScripts,
  autoUpdateInternals,
  runAutoUpdate,
  safeExtractPath,
  selectBackupsToDelete,
} from "../src/helpers/autoUpdate.js";

type ZipEntry = { name: string; data: string | Buffer; declaredSize?: number };

function createStoredZip(entries: ZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const declaredSize = entry.declaredSize ?? data.length;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(declaredSize, 18);
    local.writeUInt32LE(declaredSize, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(declaredSize, 20);
    central.writeUInt32LE(declaredSize, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, name);
    localOffset += local.length + name.length + data.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function runtimeZip(label: string, options: { includeLock?: boolean } = {}): Buffer {
  const root = "misa-commit";
  const entries: ZipEntry[] = [
    { name: `${root}/src/index.ts`, data: `${label}-src` },
    { name: `${root}/scripts/build.mjs`, data: `${label}-script` },
    { name: `${root}/dist/index.js`, data: `${label}-dist` },
    { name: `${root}/package.json`, data: `${label}-package` },
  ];
  if (options.includeLock !== false) entries.push({ name: `${root}/package-lock.json`, data: `${label}-lock` });
  return createStoredZip(entries);
}

async function writeRuntime(root: string, label: string): Promise<void> {
  await Promise.all([
    fs.mkdir(path.join(root, "src"), { recursive: true }),
    fs.mkdir(path.join(root, "scripts"), { recursive: true }),
    fs.mkdir(path.join(root, "dist"), { recursive: true }),
    fs.mkdir(path.join(root, "dados"), { recursive: true }),
  ]);
  await Promise.all([
    fs.writeFile(path.join(root, "src", "index.ts"), `${label}-src`),
    fs.writeFile(path.join(root, "scripts", "build.mjs"), `${label}-script`),
    fs.writeFile(path.join(root, "dist", "index.js"), `${label}-dist`),
    fs.writeFile(path.join(root, "package.json"), `${label}-package`),
    fs.writeFile(path.join(root, "package-lock.json"), `${label}-lock`),
    fs.writeFile(path.join(root, "dados", "marker.txt"), "preserved"),
  ]);
}

function updateFetch(sha: string, archive: Buffer, announcedSize?: number): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("api.github.com")) {
      return new Response(JSON.stringify({ object: { sha } }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(archive, {
      status: 200,
      headers: { "content-length": String(announcedSize ?? archive.length), "content-type": "application/zip" },
    });
  }) as typeof fetch;
}

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

describe("approveNpmInstallScripts", () => {
  it("runs without throwing against the project root", () => {
    const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
    assert.doesNotThrow(() => approveNpmInstallScripts(root));
  });
});

describe("runAutoUpdate", () => {
  it("does not stage or restart when main commit is already applied", async () => {
    const root = path.join(tmpdir(), `misa-update-${randomUUID()}`);
    const data = path.join(root, "dados");
    const sha = "a".repeat(40);
    await fs.mkdir(data, { recursive: true });
    await fs.writeFile(path.join(data, "update-state.json"), JSON.stringify({
      commit: sha,
      archiveSha256: "hash",
      appliedAt: new Date().toISOString(),
    }));
    let commandCalls = 0;
    let restartCalls = 0;
    const fetchMock = (async () => new Response(JSON.stringify({ object: { sha } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;

    try {
      await runAutoUpdate({
        root,
        dataDir: data,
        fetch: fetchMock,
        runCommand: () => { commandCalls += 1; },
        restart: () => { restartCalls += 1; },
        exit: () => { throw new Error("exit should not run"); },
      });
      assert.equal(commandCalls, 0);
      assert.equal(restartCalls, 0);
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("validates, activates and records an update without real processes", async () => {
    const root = path.join(tmpdir(), `misa-update-${randomUUID()}`);
    const data = path.join(root, "dados");
    const sha = "b".repeat(40);
    await writeRuntime(root, "old");
    await Promise.all(["001", "002", "003"].map((name) => fs.mkdir(path.join(data, "backups", `update-${name}`), { recursive: true })));
    const commands: string[] = [];
    let approvals = 0;
    let restarts = 0;
    let exits = 0;
    try {
      await runAutoUpdate({
        root,
        dataDir: data,
        fetch: updateFetch(sha, runtimeZip("new")),
        runCommand: (_command, args, cwd) => { commands.push(`${path.basename(cwd)}:${args.join(" ")}`); },
        approveScripts: () => { approvals += 1; return true; },
        restart: () => { restarts += 1; },
        exit: () => { exits += 1; },
        maxBackups: 2,
      });
      assert.equal(await fs.readFile(path.join(root, "src", "index.ts"), "utf8"), "new-src");
      assert.equal(await fs.readFile(path.join(root, "scripts", "build.mjs"), "utf8"), "new-script");
      assert.equal(await fs.readFile(path.join(root, "dist", "index.js"), "utf8"), "new-dist");
      assert.equal(await fs.readFile(path.join(data, "marker.txt"), "utf8"), "preserved");
      const state = JSON.parse(await fs.readFile(path.join(data, "update-state.json"), "utf8"));
      assert.equal(state.commit, sha);
      assert.equal(commands.length, 7);
      assert.equal(approvals, 2);
      assert.equal(restarts, 1);
      assert.equal(exits, 1);
      assert.equal((await fs.readdir(path.join(data, "backups"))).length, 2);
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("rolls back the complete runtime when root install fails", async () => {
    const root = path.join(tmpdir(), `misa-update-${randomUUID()}`);
    const data = path.join(root, "dados");
    const sha = "c".repeat(40);
    await writeRuntime(root, "old");
    let failedRootInstall = false;
    let restarts = 0;
    try {
      await runAutoUpdate({
        root,
        dataDir: data,
        fetch: updateFetch(sha, runtimeZip("new")),
        runCommand: (_command, args, cwd) => {
          if (cwd === root && args[0] === "ci" && !failedRootInstall) {
            failedRootInstall = true;
            throw new Error("root install failed");
          }
        },
        approveScripts: () => true,
        restart: () => { restarts += 1; },
        exit: () => undefined,
      });
      for (const [relative, expected] of [
        ["src/index.ts", "old-src"],
        ["scripts/build.mjs", "old-script"],
        ["dist/index.js", "old-dist"],
        ["package.json", "old-package"],
        ["package-lock.json", "old-lock"],
      ]) {
        assert.equal(await fs.readFile(path.join(root, relative), "utf8"), expected);
      }
      assert.equal(await fs.readFile(path.join(data, "marker.txt"), "utf8"), "preserved");
      await assert.rejects(fs.access(path.join(data, "update-state.json")));
      assert.equal(restarts, 0);
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("does not touch runtime when staging is incomplete", async () => {
    const root = path.join(tmpdir(), `misa-update-${randomUUID()}`);
    const data = path.join(root, "dados");
    await writeRuntime(root, "old");
    let commands = 0;
    try {
      await runAutoUpdate({
        root,
        dataDir: data,
        fetch: updateFetch("d".repeat(40), runtimeZip("new", { includeLock: false })),
        runCommand: () => { commands += 1; },
        approveScripts: () => true,
        restart: () => undefined,
        exit: () => undefined,
      });
      assert.equal(await fs.readFile(path.join(root, "src", "index.ts"), "utf8"), "old-src");
      assert.equal(commands, 0);
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("rejects oversized archive headers and ZIP entries", async () => {
    const root = path.join(tmpdir(), `misa-update-${randomUUID()}`);
    await writeRuntime(root, "old");
    try {
      await runAutoUpdate({
        root,
        dataDir: path.join(root, "dados"),
        fetch: updateFetch("e".repeat(40), Buffer.from("zip"), MAX_ARCHIVE_BYTES + 1),
        runCommand: () => { throw new Error("must not run"); },
        approveScripts: () => true,
        restart: () => undefined,
        exit: () => undefined,
      });
      assert.equal(await fs.readFile(path.join(root, "src", "index.ts"), "utf8"), "old-src");

      const zipPath = path.join(root, "large.zip");
      await fs.writeFile(zipPath, createStoredZip([{ name: "root/file", data: "x", declaredSize: MAX_ENTRY_BYTES + 1 }]));
      await assert.rejects(autoUpdateInternals.extractZip(zipPath, path.join(root, "extract")), /ENTRY_TOO_LARGE/);
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });
});
