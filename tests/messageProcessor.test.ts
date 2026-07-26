import { describe, it } from "node:test";
import assert from "node:assert";
import type { WASocket } from "baileys";
import { authorizeCommand, parseCommandInput } from "../src/handlers/messageProcessor.js";
import type { Command } from "../src/types/Command.js";

const command: Command = {
  name: "ping",
  description: "Ping",
  category: "all",
  async execute() {},
};

function authorization(overrides: Record<string, unknown> = {}) {
  const sent: string[] = [];
  const misa = {
    sendMessage: async (_from: string, content: { text?: string }) => { sent.push(content.text ?? ""); },
  } as unknown as WASocket;
  return {
    sent,
    input: {
      command,
      misa,
      from: "chat",
      isGroup: true,
      userIsOwner: false,
      groupAdminOnly: false,
      userIsAdmin: async () => false,
      botIsAdmin: async () => true,
      isCommandBlocked: async () => false,
      t: (key: string) => key,
      ...overrides,
    },
  };
}

describe("messageProcessor command stages", () => {
  it("parses command name, args and multiline raw args", () => {
    assert.deepEqual(parseCommandInput("!Eval first\nsecond value", "!"), {
      commandName: "eval",
      rawArgs: "first\nsecond value",
      args: ["first", "second", "value"],
    });
  });

  it("denies owner-only commands before other checks", async () => {
    let blockedChecked = false;
    const state = authorization({
      command: { ...command, ownerOnly: true },
      isCommandBlocked: async () => { blockedChecked = true; return false; },
    });
    assert.equal(await authorizeCommand(state.input), false);
    assert.deepEqual(state.sent, ["errors.ownerOnly"]);
    assert.equal(blockedChecked, false);
  });

  it("enforces group admin-only mode", async () => {
    const state = authorization({ groupAdminOnly: true });
    assert.equal(await authorizeCommand(state.input), false);
    assert.deepEqual(state.sent, ["errors.groupCommandsAdminOnly"]);
  });

  it("allows an authorized command without sending an error", async () => {
    const state = authorization({ userIsAdmin: async () => true });
    assert.equal(await authorizeCommand(state.input), true);
    assert.deepEqual(state.sent, []);
  });
});
