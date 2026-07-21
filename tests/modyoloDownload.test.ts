import { describe, it } from "node:test";
import assert from "node:assert";
import { parseModyoloSearchResults, parseModyoloVersions } from "../src/helpers/modyoloDownload.js";

describe("parseModyoloSearchResults", () => {
  it("parses app cards from search html", () => {
    const html = `
      <div class="col-12 col-md-6 col-xl-4 mb-3">
        <a href="https://modyolo.com/minecraft-mod/">
          <h3>Minecraft MOD</h3>
        </a>
        <svg></svg><span class="align-middle">1.21</span>
        <span>+</span><span class="align-middle">120 MB</span>
        <svg path></svg><span class="align-middle">Unlimited money</span></div></div>
        <img src="https://cdn.example.com/150x150/icon.jpg" />
      </div>
    `;

    const results = parseModyoloSearchResults(html);
    assert.equal(results.length, 1);
    assert.equal(results[0].name, "Minecraft MOD");
    assert.equal(results[0].url, "https://modyolo.com/minecraft-mod/");
    assert.equal(results[0].version, "1.21");
    assert.equal(results[0].size, "120 MB");
  });
});

describe("parseModyoloVersions", () => {
  it("parses version blocks and direct download id", () => {
    const withVersions = `
      <div class="border rounded mb-2">
        <a href="#version-1">1.20.1</a>
        <a href="/download/minecraft/12345">Download</a>
        <span class="text-muted d-block ml-auto">90 MB</span>
      </div></div></div>
    `;
    const parsed = parseModyoloVersions(withVersions);
    assert.equal(parsed.versions.length, 1);
    assert.equal(parsed.versions[0].downloadID, "12345");
    assert.equal(parsed.directDownloadID, "");

    const direct = parseModyoloVersions(`<a href="/download/app/999">Download</a>`);
    assert.equal(direct.versions.length, 0);
    assert.equal(direct.directDownloadID, "999");
  });
});
