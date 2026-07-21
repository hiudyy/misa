import { describe, it } from "node:test";
import assert from "node:assert";
import { extractIdentityDigits, matchesOwnerIdentity } from "../src/helpers/isOwner.js";

describe("extractIdentityDigits", () => {
  it("extracts digits from raw phone number", () => {
    assert.equal(extractIdentityDigits("5511999999999"), "5511999999999");
  });

  it("extracts digits from PN JID", () => {
    assert.equal(extractIdentityDigits("5511999999999@s.whatsapp.net"), "5511999999999");
  });

  it("strips non-digit formatting", () => {
    assert.equal(extractIdentityDigits("+55 11 99999-9999"), "5511999999999");
  });
});

describe("matchesOwnerIdentity", () => {
  it("matches by ownerLID when present", () => {
    assert.equal(
      matchesOwnerIdentity("abc123@lid", {
        ownerLID: "abc123@lid",
        ownerNumber: "5511999999999",
      }),
      true,
    );
  });

  it("rejects other LIDs when ownerLID is set", () => {
    assert.equal(
      matchesOwnerIdentity("other@lid", {
        ownerLID: "abc123@lid",
        ownerNumber: "5511999999999",
      }),
      false,
    );
  });

  it("falls back to ownerNumber digits when ownerLID is missing", () => {
    assert.equal(
      matchesOwnerIdentity("5511999999999@s.whatsapp.net", {
        ownerNumber: "5511999999999",
      }),
      true,
    );
  });

  it("falls back to cached owner LID", () => {
    assert.equal(
      matchesOwnerIdentity("cached@lid", {
        ownerNumber: "5511999999999",
        cachedOwnerLid: "cached@lid",
      }),
      true,
    );
  });

  it("returns false when nothing is configured", () => {
    assert.equal(matchesOwnerIdentity("5511999999999@s.whatsapp.net", {}), false);
  });

  it("returns false for empty user id", () => {
    assert.equal(
      matchesOwnerIdentity("", {
        ownerLID: "abc123@lid",
      }),
      false,
    );
  });
});
