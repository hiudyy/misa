import { describe, it } from "node:test";
import assert from "node:assert";
import type { proto, WASocket } from "baileys";
import { extractTargetUserJid, resolveTargetUserLid } from "../src/helpers/targetUser.js";
import kickCommand from "../src/commands/all/grupo/kick.js";
import promoteCommand from "../src/commands/all/grupo/promote.js";
import demoteCommand from "../src/commands/all/grupo/demote.js";

const quotedParticipant = "123456789@lid";

function quotedMessage(participant = quotedParticipant): proto.IWebMessageInfo {
  return {
    key: { remoteJid: "group@g.us", fromMe: false, id: "command" },
    message: {
      extendedTextMessage: {
        text: "!command",
        contextInfo: {
          stanzaId: "quoted-id",
          participant,
          quotedMessage: { conversation: "hello" },
        },
      },
    },
  };
}

describe("target user resolution", () => {
  it("prioritizes explicit mention over quoted participant", () => {
    const message = quotedMessage();
    message.message!.extendedTextMessage!.contextInfo!.mentionedJid = ["987654321@lid"];
    assert.equal(extractTargetUserJid(message), "987654321@lid");
  });

  it("uses the participant of a quoted group message", () => {
    assert.equal(extractTargetUserJid(quotedMessage()), quotedParticipant);
  });

  it("reads context info from media captions", () => {
    const message: proto.IWebMessageInfo = {
      key: { remoteJid: "group@g.us" },
      message: {
        imageMessage: {
          caption: "!kick",
          contextInfo: { stanzaId: "quoted", participant: quotedParticipant, quotedMessage: { conversation: "x" } },
        },
      },
    };
    assert.equal(extractTargetUserJid(message), quotedParticipant);
  });

  it("falls back to private remote JID only when replying", () => {
    const message: proto.IWebMessageInfo = {
      key: { remoteJid: "5511999999999@s.whatsapp.net" },
      message: { extendedTextMessage: { contextInfo: { stanzaId: "quoted", quotedMessage: { conversation: "x" } } } },
    };
    assert.equal(extractTargetUserJid(message), "5511999999999@s.whatsapp.net");
    assert.equal(extractTargetUserJid({ key: { remoteJid: "5511999999999@s.whatsapp.net" }, message: { conversation: "!kick" } }), null);
  });

  it("resolves an already-LID quoted participant", async () => {
    const result = await resolveTargetUserLid(quotedMessage(), {} as WASocket);
    assert.deepEqual(result, { rawJid: quotedParticipant, lid: quotedParticipant });
  });

  for (const [command, action] of [
    [kickCommand, "remove"],
    [promoteCommand, "promote"],
    [demoteCommand, "demote"],
  ] as const) {
    it(`${command.name} accepts a replied message`, async () => {
      const updates: Array<{ ids: string[]; action: string }> = [];
      const misa = {
        groupParticipantsUpdate: async (_group: string, ids: string[], updateAction: string) => {
          updates.push({ ids, action: updateAction });
        },
        sendMessage: async () => undefined,
      } as unknown as WASocket;
      await command.execute({
        misa,
        message: quotedMessage(),
        from: "group@g.us",
        t: (key: string) => key,
      } as never);
      assert.deepEqual(updates, [{ ids: [quotedParticipant], action }]);
    });
  }
});
