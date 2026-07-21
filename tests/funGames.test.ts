/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  FEMALE_PERCENT_TRAITS,
  FEMALE_RANK_TRAITS,
  INTERACTION_ACTIONS,
  MALE_PERCENT_TRAITS,
  MALE_RANK_TRAITS,
  pickRandomMembers,
  randomPercent,
  traitLabelFromRank,
} from "../src/helpers/funGames.js";
import {
  createFunInteractionCommands,
  createFunPercentCommands,
  createFunRankCommands,
} from "../src/helpers/funCommands.js";

describe("funGames", () => {
  it("has unique male/female percent trait names", () => {
    const male = MALE_PERCENT_TRAITS.map((t) => t.name);
    const female = FEMALE_PERCENT_TRAITS.map((t) => t.name);
    assert.strictEqual(new Set(male).size, male.length);
    assert.strictEqual(new Set(female).size, female.length);
  });

  it("has unique rank names", () => {
    const all = [...MALE_RANK_TRAITS, ...FEMALE_RANK_TRAITS].map((t) => t.name);
    assert.strictEqual(new Set(all).size, all.length);
  });

  it("randomPercent stays in 0..100", () => {
    for (let i = 0; i < 50; i++) {
      const value = randomPercent();
      assert.ok(value >= 0 && value <= 100);
    }
  });

  it("pickRandomMembers returns requested size", () => {
    const members = ["a", "b", "c", "d", "e", "f"];
    const picked = pickRandomMembers(members, 5);
    assert.strictEqual(picked.length, 5);
    assert.strictEqual(new Set(picked).size, 5);
  });

  it("traitLabelFromRank strips rank prefix", () => {
    assert.strictEqual(traitLabelFromRank("rankgay"), "gay");
  });

  it("factories create one command per trait", () => {
    assert.strictEqual(
      createFunPercentCommands().length,
      MALE_PERCENT_TRAITS.length + FEMALE_PERCENT_TRAITS.length,
    );
    assert.strictEqual(
      createFunRankCommands().length,
      MALE_RANK_TRAITS.length + FEMALE_RANK_TRAITS.length,
    );
    assert.strictEqual(createFunInteractionCommands().length, INTERACTION_ACTIONS.length);
  });

  it("interaction actions have unique names", () => {
    const names = INTERACTION_ACTIONS.map((t) => t.name);
    assert.strictEqual(new Set(names).size, names.length);
    assert.ok(names.includes("tapa"));
    assert.ok(names.includes("beijo"));
  });
});
