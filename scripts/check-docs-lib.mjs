import { promises as fs } from "node:fs";
import path from "node:path";

export const DOC_LOCALES = ["pt", "en", "es", "id", "ar", "fr", "hi", "ur", "de", "tr", "bn"];
export const DOC_FILES = ["installation.md", "architecture.md", "configuration.md", "legal.md"];

const requiredTerms = {
  "installation.md": ["Node.js 22", "npm ci", "Docker", "dados/"],
  "architecture.md": ["MessageHandler", "MediaQueue", "auto-update", "i18n"],
  "configuration.md": ["dados/config.json", "schemaVersion", "maxConcurrent", "maxBackups"],
  "legal.md": ["WhatsApp", "MIT", "Meta", "dados/"],
};

export async function checkDocs(root) {
  const errors = [];
  for (const locale of DOC_LOCALES) {
    for (const file of DOC_FILES) {
      const filePath = path.join(root, "docs", locale, file);
      let content = "";
      try {
        content = await fs.readFile(filePath, "utf8");
      } catch {
        errors.push(`missing docs/${locale}/${file}`);
        continue;
      }
      if (!content.includes(`<!-- locale: ${locale}; docs-version: 1 -->`)) {
        errors.push(`invalid metadata docs/${locale}/${file}`);
      }
      if (content.length < 500) errors.push(`document too short docs/${locale}/${file}`);
      for (const term of requiredTerms[file]) {
        if (!content.includes(term)) errors.push(`missing '${term}' in docs/${locale}/${file}`);
      }
    }
  }

  const readme = await fs.readFile(path.join(root, "README.md"), "utf8");
  for (const locale of DOC_LOCALES) {
    for (const file of DOC_FILES) {
      const link = `docs/${locale}/${file}`;
      if (!readme.includes(link)) errors.push(`README missing link ${link}`);
    }
  }
  return errors;
}
