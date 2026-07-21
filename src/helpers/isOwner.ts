/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { getBotConfig } from "../config.js";
import { lidCache } from "../cache/lidCache.js";

/** Extrai apenas dígitos do user part de um JID/número. */
export function extractIdentityDigits(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const at = trimmed.indexOf("@");
  const userPart = at === -1 ? trimmed : trimmed.slice(0, at);
  return userPart.replace(/\D/g, "");
}

/**
 * Compara identidade do usuário com dono configurado (LID, número ou cache).
 * Função pura testável — não lê disco.
 */
export function matchesOwnerIdentity(
  userId: string,
  owner: { ownerLID?: string; ownerNumber?: string; cachedOwnerLid?: string | null },
): boolean {
  const trimmedUser = userId.trim();
  if (!trimmedUser) return false;

  if (owner.ownerLID && trimmedUser === owner.ownerLID) {
    return true;
  }

  if (owner.cachedOwnerLid && trimmedUser === owner.cachedOwnerLid) {
    return true;
  }

  const ownerDigits = extractIdentityDigits(owner.ownerNumber ?? "");
  if (!ownerDigits) return false;

  // Fallback temporário enquanto ownerLID ainda não foi persistido (JID PN)
  return extractIdentityDigits(trimmedUser) === ownerDigits;
}

export async function isOwner(userLID: string): Promise<boolean> {
  const config = await getBotConfig();

  let cachedOwnerLid: string | null = null;
  if (!config.ownerLID && config.ownerNumber) {
    const ownerDigits = extractIdentityDigits(config.ownerNumber);
    if (ownerDigits) {
      await lidCache.load();
      cachedOwnerLid = lidCache.get(`${ownerDigits}@s.whatsapp.net`);
    }
  }

  return matchesOwnerIdentity(userLID, {
    ownerLID: config.ownerLID,
    ownerNumber: config.ownerNumber,
    cachedOwnerLid,
  });
}
