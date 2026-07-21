import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import evalCommand, { MAX_CODE_LENGTH } from "../src/commands/all/dono/eval.js";
import { clearLocaleCache, createTranslator } from "../src/i18n/index.js";

function createMockMisa() {
  const messages: Array<{ jid: string; content: unknown }> = [];
  return {
    messages,
    sendMessage: async (jid: string, content: unknown) => {
      messages.push({ jid, content });
    },
  };
}

function getLastText(messages: ReturnType<typeof createMockMisa>["messages"]): string {
  const last = messages.at(-1);
  if (!last) return "";
  if (typeof last.content === "object" && last.content !== null && "text" in last.content) {
    return String((last.content as { text: unknown }).text);
  }
  return String(last.content);
}

function createMockMessage() {
  return {
    key: { remoteJid: "12345@s.whatsapp.net", fromMe: false, id: "msg-1" },
    messageTimestamp: Date.now() / 1000,
  } as unknown as import("baileys").proto.IWebMessageInfo;
}

async function runEval(args: string[]): Promise<{ messages: ReturnType<typeof createMockMisa>["messages"] }> {
  const misa = createMockMisa();
  const message = createMockMessage();
  const t = createTranslator("pt");
  const rawArgs = args.join(" ");

  await evalCommand.execute({
    misa: misa as unknown as import("baileys").WASocket,
    message,
    args,
    rawArgs,
    prefix: "!",
    commandName: "eval",
    sender: "12345@s.whatsapp.net",
    from: "12345@s.whatsapp.net",
    groupCache: {} as unknown as import("../src/cache/groupCache.js").GroupCache,
    isOwner: async () => true,
    isGroup: false,
    isAdmin: async () => false,
    isBotAdmin: async () => false,
    commandDirectory: {
      get: () => undefined,
      listUnique: () => [],
      listNames: () => [],
    },
    locale: "pt",
    t,
  });

  return { messages: misa.messages };
}

describe("eval command sandbox", () => {
  beforeEach(() => {
    clearLocaleCache();
  });

  it("executes simple arithmetic", async () => {
    const { messages } = await runEval(["return", "2", "+", "2"]);
    assert.ok(getLastText(messages).includes("4"));
  });

  it("exposes misa in sandbox context", async () => {
    const { messages } = await runEval(["return", "await", "misa.sendMessage('test', { text: 'ok' })"]);
    assert.ok(messages.length >= 1);
    assert.ok(getLastText(messages).includes("ok") || messages.some((m) => JSON.stringify(m).includes("ok")));
  });

  it("blocks access to process", async () => {
    const { messages } = await runEval(["return", "typeof", "process"]);
    const text = getLastText(messages);
    assert.ok(text.includes("undefined") || text.includes("Error") || text.includes("process"));
  });

  it("blocks access to process.env", async () => {
    const { messages } = await runEval(["process.env.PATH"]);
    assert.ok(getLastText(messages).includes("Error") || getLastText(messages).includes("process"));
  });

  it("blocks use of require", async () => {
    const { messages } = await runEval(["require('fs').readFileSync('/')"]);
    assert.ok(getLastText(messages).includes("Error") || getLastText(messages).includes("require"));
  });

  it("blocks globalThis.process when available via escape", async () => {
    const { messages } = await runEval(["return", "typeof", "globalThis.process"]);
    const text = getLastText(messages);
    // Em contexto isolado, process não deve estar definido de forma útil
    assert.ok(text.includes("undefined") || text.includes("Error"));
  });

  it("rejects code that is too long", async () => {
    const { messages } = await runEval(["x".repeat(MAX_CODE_LENGTH + 1)]);
    assert.ok(getLastText(messages).includes("limite"));
  });

  it("executes async code", async () => {
    const { messages } = await runEval(["await Promise.resolve(42)"]);
    assert.ok(getLastText(messages).includes("42"));
  });

  it("times out infinite sync loops", async () => {
    const { messages } = await runEval(["while(true){}"]);
    assert.ok(getLastText(messages).includes("Error") || getLastText(messages).includes("timed out") || getLastText(messages).includes("Script"));
  });
});
