/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { USyncQuery, USyncUser } from "baileys";
import { isJidGroup, isJidStatusBroadcast, isLidUser, jidDecode, jidEncode, jidNormalizedUser, WASocket } from "baileys";
import { lidCache } from "../cache/lidCache.js";

function normalizeToPN(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isLidUser(trimmed)) return null;

  const decoded = jidDecode(trimmed);

  if (decoded) {
    const { server, user } = decoded;
    if (server === "g.us" || server === "broadcast" || server === "newsletter") return null;
    if (server === "s.whatsapp.net" || server === "c.us") return jidEncode(user, "s.whatsapp.net");
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return null;

  return jidEncode(digits, "s.whatsapp.net");
}

export async function toLID(input: string, misa: WASocket): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isLidUser(trimmed)) return jidNormalizedUser(trimmed);
  if (isJidGroup(trimmed) || isJidStatusBroadcast(trimmed)) return null;

  const pn = normalizeToPN(trimmed);
  if (!pn) return null;

  const user = jidDecode(pn)?.user;
  if (!user) return null;

  // 1. cache em memoria/arquivo
  await lidCache.load();
  const cached = lidCache.get(pn);
  if (cached) return cached;

  // 2. tenta o store local do Baileys
  const fromStore = await misa.signalRepository.lidMapping.getLIDForPN(pn).catch(() => null);
  if (fromStore) {
    lidCache.set(pn, fromStore);
    return fromStore;
  }

  // 3. consulta USync diretamente com LIDProtocol
  try {
    const query = new USyncQuery()
      .withLIDProtocol()
      .withContext("interactive")
      .withUser(new USyncUser().withId(pn));

    const result = await misa.executeUSyncQuery(query);
    const entry = result?.list.find((r) => r.id === pn);
    const lid = entry?.["lid"] as string | undefined;
    const normalized = lid ? jidNormalizedUser(lid) : null;

    if (normalized) lidCache.set(pn, normalized);
    return normalized;
  } catch {
    return null;
  }
}
