/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WAMessage } from "baileys";
import { getGroup } from "../database/groupDB.js";
import { toLID } from "./toLID.js";
import {
  FEMALE_PERCENT_TRAITS,
  FEMALE_RANK_TRAITS,
  FUN_RANK_MIN_MEMBERS,
  FUN_RANK_SIZE,
  INTERACTION_ACTIONS,
  MALE_PERCENT_TRAITS,
  MALE_RANK_TRAITS,
  pickRandomMembers,
  randomPercent,
  traitLabelFromRank,
  type FunTrait,
} from "./funGames.js";
import { getPercentText, getRankHeader, readFunMedia } from "./funMedia.js";
import type { Command, CommandContext } from "../types/Command.js";
import { extractTargetUserJid } from "./targetUser.js";

async function ensureFunMode(ctx: CommandContext): Promise<boolean> {
  const group = await getGroup(ctx.from);
  if (group.modobn) return true;

  await ctx.misa.sendMessage(
    ctx.from,
    { text: ctx.t("commands.fun.modobnRequired") },
    { quoted: ctx.message as WAMessage },
  );
  return false;
}

async function resolveTarget(ctx: CommandContext): Promise<string> {
  const selected = extractTargetUserJid(ctx.message);
  if (!selected) return ctx.sender;
  return (await toLID(selected, ctx.misa)) || ctx.sender;
}

async function resolveInteractionTarget(ctx: CommandContext): Promise<string | null> {
  const selected = extractTargetUserJid(ctx.message);
  if (selected) return (await toLID(selected, ctx.misa)) || selected;

  return null;
}

async function sendFunCaption(
  ctx: CommandContext,
  caption: string,
  mentions: string[],
  mediaKey: string,
  section: "games" | "ranks" | "games2",
): Promise<void> {
  const media = await readFunMedia(section, mediaKey);
  const quoted = { quoted: ctx.message as WAMessage };

  if (media?.type === "image") {
    await ctx.misa.sendMessage(
      ctx.from,
      { image: media.buffer, caption, mentions },
      quoted,
    );
    return;
  }

  if (media?.type === "video") {
    await ctx.misa.sendMessage(
      ctx.from,
      { video: media.buffer, caption, mentions, gifPlayback: true },
      quoted,
    );
    return;
  }

  await ctx.misa.sendMessage(ctx.from, { text: caption, mentions }, quoted);
}

function createPercentCommand(trait: FunTrait): Command {
  return {
    name: trait.name,
    aliases: trait.aliases,
    description: `Fun percentage command: ${trait.name}`,
    category: "brincadeiras",
    groupOnly: true,
    async execute(ctx) {
      if (!(await ensureFunMode(ctx))) return;

      const target = await resolveTarget(ctx);
      const level = randomPercent();
      const mentionTag = `@${target.split("@")[0]}`;
      const fallback = ctx.t("commands.fun.percentResult", {
        user: mentionTag,
        level: String(level),
        trait: trait.name,
      });
      const caption = getPercentText(trait.name, mentionTag, level, fallback);

      await sendFunCaption(ctx, caption, [target], trait.name, "games");
    },
  };
}

function createRankCommand(trait: FunTrait): Command {
  return {
    name: trait.name,
    aliases: trait.aliases,
    description: `Fun rank command: ${trait.name}`,
    category: "brincadeiras",
    groupOnly: true,
    async execute(ctx) {
      if (!(await ensureFunMode(ctx))) return;

      const meta = await ctx.misa.groupMetadata(ctx.from).catch(() => null);
      const members = (meta?.participants ?? [])
        .map((p) => p.id)
        .filter((id): id is string => Boolean(id));

      if (members.length < FUN_RANK_MIN_MEMBERS) {
        await ctx.misa.sendMessage(
          ctx.from,
          { text: ctx.t("commands.fun.rankNotEnough", { min: String(FUN_RANK_MIN_MEMBERS) }) },
          { quoted: ctx.message as WAMessage },
        );
        return;
      }

      const top = pickRandomMembers(members, FUN_RANK_SIZE);
      const label = traitLabelFromRank(trait.name);
      const header = getRankHeader(
        trait.name,
        ctx.t("commands.fun.rankHeader", { trait: label }),
      );
      const items = top
        .map((id, index) =>
          ctx.t("commands.fun.rankItem", {
            pos: String(index + 1),
            user: `@${id.split("@")[0]}`,
          }),
        )
        .join("\n");
      const caption = `${header}\n\n${items}`;

      await sendFunCaption(ctx, caption, top, trait.name, "ranks");
    },
  };
}

function createInteractionCommand(action: FunTrait): Command {
  return {
    name: action.name,
    aliases: action.aliases,
    description: `Fun interaction: ${action.name}`,
    category: "brincadeiras",
    groupOnly: true,
    async execute(ctx) {
      if (!(await ensureFunMode(ctx))) return;

      const target = await resolveInteractionTarget(ctx);
      if (!target) {
        await ctx.misa.sendMessage(
          ctx.from,
          { text: ctx.t("commands.fun.interactionUsage", { command: action.name }) },
          { quoted: ctx.message as WAMessage },
        );
        return;
      }

      if (target === ctx.sender) {
        await ctx.misa.sendMessage(
          ctx.from,
          { text: ctx.t("commands.fun.interactionSelf") },
          { quoted: ctx.message as WAMessage },
        );
        return;
      }

      const fromTag = `@${ctx.sender.split("@")[0]}`;
      const toTag = `@${target.split("@")[0]}`;
      const caption = ctx.t(`commands.fun.interactions.${action.name}`, {
        from: fromTag,
        to: toTag,
      });

      // Se a chave i18n não existir, t() devolve a própria chave — usa template genérico.
      const finalCaption = caption.startsWith("commands.fun.interactions.")
        ? ctx.t("commands.fun.interactionGeneric", {
            from: fromTag,
            to: toTag,
            action: action.name,
          })
        : caption;

      await sendFunCaption(ctx, finalCaption, [ctx.sender, target], action.name, "games2");
    },
  };
}

export function createFunPercentCommands(): Command[] {
  return [...MALE_PERCENT_TRAITS, ...FEMALE_PERCENT_TRAITS].map(createPercentCommand);
}

export function createFunRankCommands(): Command[] {
  return [...MALE_RANK_TRAITS, ...FEMALE_RANK_TRAITS].map(createRankCommand);
}

export function createFunInteractionCommands(): Command[] {
  return INTERACTION_ACTIONS.map(createInteractionCommand);
}
