import assert from "node:assert/strict";
import {
  getLocalizedCommandWordVars,
  replaceLocalizedPlaceholders,
  resolveLocalizedToken,
} from "../src/helpers/localizedTokens.js";

function testResolveLocalizedToken(): void {
  assert.equal(resolveLocalizedToken("pt", "punicao", ["punishment"]), "punicao");
  assert.equal(resolveLocalizedToken("en", "punishment", ["punishment"]), "punicao");
  
  assert.equal(resolveLocalizedToken("es", "eliminar", ["delete"]), "apagar");
  assert.equal(resolveLocalizedToken("de", "löschen", ["delete"]), null);
  assert.equal(resolveLocalizedToken("de", "loeschen", ["delete"]), "apagar");
  assert.equal(resolveLocalizedToken("tr", "kapat", ["close"]), "close");
  assert.equal(resolveLocalizedToken("hi", "chalu", ["on"]), "on");
  assert.equal(resolveLocalizedToken("ur", "ghairfaal", ["off"]), "off");
  assert.equal(resolveLocalizedToken("bn", "রিসেট", ["reset"]), "reset");
  assert.equal(resolveLocalizedToken("fr", "invalide", ["ban"]), null);
}

function testReplaceLocalizedPlaceholders(): void {
  assert.equal(
    replaceLocalizedPlaceholders("Welcome @user to @group", "en", {
      user: "Alice",
      group: "Team",
    }),
    "Welcome Alice to Team",
  );

  assert.equal(
    replaceLocalizedPlaceholders("Bem-vindo @usuario ao @grupo", "pt", {
      user: "Alice",
      group: "Time",
    }),
    "Bem-vindo Alice ao Time",
  );

  assert.equal(
    replaceLocalizedPlaceholders("❌ @उपयोगकर्ता, @कमांड नहीं मिला", "hi", {
      user: "Asha",
      command: "playy",
    }),
    "❌ Asha, playy नहीं मिला",
  );

  assert.equal(
    replaceLocalizedPlaceholders("🚫 @ব্যবহারকারী, @ধরন অনুমোদিত নয়", "bn", {
      user: "Rahim",
      type: "লিংক",
    }),
    "🚫 Rahim, লিংক অনুমোদিত নয়",
  );
}

function testGetLocalizedCommandWordVars(): void {
  const tr = getLocalizedCommandWordVars("tr");
  assert.equal(tr.punishment, "ceza");
  assert.equal(tr.delete, "sil");
  assert.equal(tr.text, "metin");
  assert.equal(tr.userPlaceholder, "@kullanici");

  const ur = getLocalizedCommandWordVars("ur");
  assert.equal(ur.mode, "mode");
  assert.equal(ur.mention, "zikr");
  assert.equal(ur.prefixPlaceholder, "@پریفکس");
}

function main(): void {
  testResolveLocalizedToken();
  testReplaceLocalizedPlaceholders();
  testGetLocalizedCommandWordVars();
  console.log("localizedTokens tests passed");
}

main();
