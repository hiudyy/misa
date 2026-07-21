import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { CommandHandler } from "../src/handlers/commandHandler.js";
import { clearLocaleCache } from "../src/i18n/index.js";

async function createTempCommandsDir(): Promise<string> {
  const dir = path.join(tmpdir(), `misa-test-commands-${Date.now()}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function writeCommand(dir: string, name: string, content: string): Promise<void> {
  await fs.writeFile(path.join(dir, `${name}.ts`), content, "utf8");
}

describe("commandHandler", () => {
  let tempDir: string;

  beforeEach(async () => {
    clearLocaleCache();
    tempDir = await createTempCommandsDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { force: true, recursive: true });
  });

  it("loads commands from directory", async () => {
    await writeCommand(
      tempDir,
      "testcmd",
      `import { Command } from "../src/types/Command.js";\nconst cmd: Command = {\n  name: "testcmd",\n  description: "Test",\n  category: "test",\n  async execute() {}\n};\nexport default cmd;`
    );

    const handler = new CommandHandler();
    await handler.loadCommands(tempDir);

    const cmd = handler.get("testcmd");
    assert.ok(cmd);
    assert.strictEqual(cmd?.name, "testcmd");
  });

  it("finds command by alias", async () => {
    await writeCommand(
      tempDir,
      "testcmd",
      `import { Command } from "../src/types/Command.js";\nconst cmd: Command = {\n  name: "testcmd",\n  aliases: ["tc", "t"],\n  description: "Test",\n  category: "test",\n  async execute() {}\n};\nexport default cmd;`
    );

    const handler = new CommandHandler();
    await handler.loadCommands(tempDir);

    assert.strictEqual(handler.get("tc")?.name, "testcmd");
    assert.strictEqual(handler.get("T")?.name, "testcmd");
  });

  it("loads an array of commands from one file", async () => {
    await writeCommand(
      tempDir,
      "bundle",
      `export default [
  { name: "one", description: "One", category: "test", async execute() {} },
  { name: "two", aliases: ["dois"], description: "Two", category: "test", async execute() {} },
];`,
    );

    const handler = new CommandHandler();
    await handler.loadCommands(tempDir);

    assert.strictEqual(handler.get("one")?.name, "one");
    assert.strictEqual(handler.get("two")?.name, "two");
    assert.strictEqual(handler.get("dois")?.name, "two");
  });

  it("lists unique commands without duplicates", async () => {
    await writeCommand(
      tempDir,
      "testcmd",
      `import { Command } from "../src/types/Command.js";\nconst cmd: Command = {\n  name: "testcmd",\n  aliases: ["tc"],\n  description: "Test",\n  category: "test",\n  async execute() {}\n};\nexport default cmd;`
    );

    const handler = new CommandHandler();
    await handler.loadCommands(tempDir);

    const unique = handler.listUnique();
    assert.strictEqual(unique.length, 1);
    assert.strictEqual(unique[0]?.name, "testcmd");
  });

  it("loads commands from nested directories", async () => {
    const nestedDir = path.join(tempDir, "nested");
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(
      path.join(nestedDir, "nestedcmd.ts"),
      `import { Command } from "../../src/types/Command.js";\nconst cmd: Command = {\n  name: "nestedcmd",\n  description: "Nested",\n  category: "test",\n  async execute() {}\n};\nexport default cmd;`,
      "utf8"
    );

    const handler = new CommandHandler();
    await handler.loadCommands(tempDir);

    assert.strictEqual(handler.get("nestedcmd")?.name, "nestedcmd");
  });
});
