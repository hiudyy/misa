import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkDocs, DOC_FILES, DOC_LOCALES } from "./check-docs-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = await checkDocs(root);
if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Documentation validated: ${DOC_LOCALES.length} locales, ${DOC_FILES.length * DOC_LOCALES.length} files.`);
}
