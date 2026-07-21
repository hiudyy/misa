import { describe, it } from "node:test";
import assert from "node:assert";
import { DisconnectReason } from "baileys";
import { getDisconnectStatusCode, shouldReconnectFromStatus } from "../src/helpers/reconnect.js";

describe("shouldReconnectFromStatus", () => {
  it("reconnects when statusCode is undefined", () => {
    assert.equal(shouldReconnectFromStatus(undefined), true);
  });

  it("does not reconnect on loggedOut", () => {
    assert.equal(shouldReconnectFromStatus(DisconnectReason.loggedOut), false);
  });

  it("does not reconnect on forbidden", () => {
    assert.equal(shouldReconnectFromStatus(DisconnectReason.forbidden), false);
  });

  it("does not reconnect on badSession", () => {
    assert.equal(shouldReconnectFromStatus(DisconnectReason.badSession), false);
  });

  it("does not reconnect on connectionReplaced", () => {
    assert.equal(shouldReconnectFromStatus(DisconnectReason.connectionReplaced), false);
  });

  it("does not reconnect on multideviceMismatch", () => {
    assert.equal(shouldReconnectFromStatus(DisconnectReason.multideviceMismatch), false);
  });

  it("reconnects on connectionLost", () => {
    assert.equal(shouldReconnectFromStatus(DisconnectReason.connectionLost), true);
  });

  it("reconnects on connectionClosed", () => {
    assert.equal(shouldReconnectFromStatus(DisconnectReason.connectionClosed), true);
  });

  it("reconnects on restartRequired", () => {
    assert.equal(shouldReconnectFromStatus(DisconnectReason.restartRequired), true);
  });

  it("reconnects on unknown status codes", () => {
    assert.equal(shouldReconnectFromStatus(999), true);
  });
});

describe("getDisconnectStatusCode", () => {
  it("extracts statusCode from Boom-like error", () => {
    assert.equal(getDisconnectStatusCode({ output: { statusCode: 401 } }), 401);
  });

  it("returns undefined for non-objects", () => {
    assert.equal(getDisconnectStatusCode(null), undefined);
    assert.equal(getDisconnectStatusCode("logged out"), undefined);
  });
});
