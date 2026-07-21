import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const i18nDir = path.resolve("src/i18n");
const commandsDir = path.resolve("src/commands");

function flattenKeys(value, prefix = "") {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(nested, nextPrefix);
  });
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(entryPath);
      return [entryPath];
    }),
  );

  return nested.flat();
}

const commandFiles = (await walk(commandsDir)).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
const commandNames = commandFiles.map((file) => path.basename(file, path.extname(file))).sort();

const files = (await readdir(i18nDir))
  .filter((file) => file.endsWith(".json"))
  .sort();

if (files.length === 0) {
  throw new Error("No locale files found in src/i18n.");
}

/** Menu command aliases must be Latin (digits/_/- ok); no Arabic/Indic scripts. */
const LATIN_ALIAS = /^[\p{Script=Latin}\p{Nd}_-]+$/u;

const locales = await Promise.all(
  files.map(async (file) => {
    const raw = await readFile(path.join(i18nDir, file), "utf8");
    const data = JSON.parse(raw);
    return {
      file,
      data,
      keys: new Set(flattenKeys(data).sort()),
    };
  }),
);

const [base, ...rest] = locales;
let hasMismatch = false;

for (const locale of locales) {
  const cmds = locale.data?.commands?.menu?.cmds ?? {};
  const nonLatin = Object.entries(cmds).filter(
    ([, value]) => typeof value !== "string" || !LATIN_ALIAS.test(value),
  );

  if (nonLatin.length) {
    hasMismatch = true;
    console.error(
      `\n${locale.file}: commands.menu.cmds must use Latin aliases (no native scripts):`,
    );
    for (const [key, value] of nonLatin) {
      console.error(`  ${key}: ${JSON.stringify(value)}`);
    }
  }
}

for (const locale of rest) {
  const missing = [...base.keys].filter((key) => !locale.keys.has(key));
  const extra = [...locale.keys].filter((key) => !base.keys.has(key));

  if (missing.length || extra.length) {
    hasMismatch = true;
    console.error(`\n${locale.file} is inconsistent with ${base.file}.`);
    if (missing.length) console.error(`Missing (${missing.length}): ${missing.join(", ")}`);
    if (extra.length) console.error(`Extra (${extra.length}): ${extra.join(", ")}`);
  }

  const missingCommandAliases = commandNames.filter(
    (commandName) => !locale.keys.has(`commands.menu.cmds.${commandName}`),
  );

  if (missingCommandAliases.length) {
    hasMismatch = true;
    console.error(
      `\n${locale.file} is missing translated aliases in commands.menu.cmds for: ${missingCommandAliases.join(", ")}`,
    );
  }
}

const missingBaseCommandAliases = commandNames.filter(
  (commandName) => !base.keys.has(`commands.menu.cmds.${commandName}`),
);

if (missingBaseCommandAliases.length) {
  hasMismatch = true;
  console.error(
    `\n${base.file} is missing translated aliases in commands.menu.cmds for: ${missingBaseCommandAliases.join(", ")}`,
  );
}

if (hasMismatch) {
  process.exit(1);
}

console.log(`Locales validated successfully: ${files.join(", ")}`);