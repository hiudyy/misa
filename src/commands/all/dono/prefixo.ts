/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getBotConfig, updateBotConfig } from "../../../config.js";
import { Command } from "../../../types/Command.js";
import {
  getLocaleLabel,
  getLocaleCommandOptions,
  isValidLocale,
  type Locale,
} from "../../../i18n/index.js";
import {
  findDuplicatePrefixLocale,
  getPrefixByLocaleEntries,
  isValidPrefixSymbol,
} from "../../../helpers/resolveCommandPrefix.js";

function formatMapSection(
  t: (key: string, vars?: Record<string, string>) => string,
  prefixByLocale: Partial<Record<Locale, string>> | undefined,
): string {
  const entries = getPrefixByLocaleEntries(prefixByLocale);
  if (entries.length === 0) return t("commands.prefixo.mapEmpty");

  return entries
    .map(([locale, prefix]) =>
      t("commands.prefixo.mapItem", {
        locale: getLocaleLabel(locale),
        code: locale,
        prefix,
      }),
    )
    .join("\n");
}

const prefixoCommand: Command = {
  name: "prefixo",
  aliases: ["prefix", "setprefix"],
  description: "Updates the bot prefix or locale prefix map",
  category: "geral",
  ownerOnly: true,
  async execute({ misa, message, from, args, t }) {
    const config = await getBotConfig();
    const quoted = { quoted: message as WAMessage };

    if (args.length === 0) {
      await misa.sendMessage(
        from,
        {
          text: t("commands.prefixo.current", {
            value: config.prefix,
            mapSection: formatMapSection(t, config.prefixByLocale),
            options: getLocaleCommandOptions(),
          }),
        },
        quoted,
      );
      return;
    }

    const action = args[0]?.toLowerCase() || "";

    if (action === "set") {
      const localeArg = args[1]?.toLowerCase() || "";
      const prefix = args[2]?.trim() || "";

      if (!localeArg || !prefix) {
        await misa.sendMessage(
          from,
          { text: t("commands.prefixo.setUsage", { options: getLocaleCommandOptions() }) },
          quoted,
        );
        return;
      }

      if (!isValidLocale(localeArg)) {
        await misa.sendMessage(
          from,
          { text: t("commands.prefixo.invalidLocale", { options: getLocaleCommandOptions() }) },
          quoted,
        );
        return;
      }

      if (!isValidPrefixSymbol(prefix)) {
        await misa.sendMessage(from, { text: t("commands.prefixo.invalid") }, quoted);
        return;
      }

      const map = { ...(config.prefixByLocale ?? {}) };
      const duplicate = findDuplicatePrefixLocale(map, localeArg, prefix);
      if (duplicate) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.prefixo.duplicate", {
              prefix,
              locale: getLocaleLabel(duplicate),
              code: duplicate,
            }),
          },
          quoted,
        );
        return;
      }

      map[localeArg] = prefix;
      await updateBotConfig((current) => ({ ...current, prefixByLocale: map }));

      await misa.sendMessage(
        from,
        {
          text: t("commands.prefixo.setOk", {
            locale: getLocaleLabel(localeArg),
            code: localeArg,
            prefix,
          }),
        },
        quoted,
      );
      return;
    }

    if (action === "del" || action === "delete" || action === "rm") {
      const localeArg = args[1]?.toLowerCase() || "";
      if (!localeArg) {
        await misa.sendMessage(
          from,
          { text: t("commands.prefixo.delUsage", { options: getLocaleCommandOptions() }) },
          quoted,
        );
        return;
      }

      if (!isValidLocale(localeArg)) {
        await misa.sendMessage(
          from,
          { text: t("commands.prefixo.invalidLocale", { options: getLocaleCommandOptions() }) },
          quoted,
        );
        return;
      }

      const map = { ...(config.prefixByLocale ?? {}) };
      if (!map[localeArg]) {
        await misa.sendMessage(
          from,
          {
            text: t("commands.prefixo.delMissing", {
              locale: getLocaleLabel(localeArg),
              code: localeArg,
            }),
          },
          quoted,
        );
        return;
      }

      delete map[localeArg];
      await updateBotConfig((current) => ({ ...current, prefixByLocale: map }));

      await misa.sendMessage(
        from,
        {
          text: t("commands.prefixo.delOk", {
            locale: getLocaleLabel(localeArg),
            code: localeArg,
          }),
        },
        quoted,
      );
      return;
    }

    if (action === "clear") {
      await updateBotConfig((current) => ({ ...current, prefixByLocale: {} }));
      await misa.sendMessage(from, { text: t("commands.prefixo.clearOk") }, quoted);
      return;
    }

    // Legacy: prefixo <symbol>
    const prefix = args[0]?.trim() || "";
    if (!isValidPrefixSymbol(prefix)) {
      await misa.sendMessage(from, { text: t("commands.prefixo.invalid") }, quoted);
      return;
    }

    await updateBotConfig((current) => ({ ...current, prefix }));

    await misa.sendMessage(
      from,
      { text: t("commands.prefixo.updated", { value: prefix }) },
      quoted,
    );
  },
};

export default prefixoCommand;
