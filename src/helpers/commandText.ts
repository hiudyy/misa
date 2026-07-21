/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */

/**
 * Returns free-form text from rawArgs after skipping the first N whitespace-separated tokens.
 * Preserves newlines in the remainder (unlike args.slice(n).join(" ")).
 */
export function textAfterTokens(rawArgs: string, skipTokens = 0): string {
  let rest = rawArgs;
  for (let i = 0; i < skipTokens; i++) {
    const match = rest.match(/^\s*\S+/);
    if (!match) return "";
    rest = rest.slice(match[0].length);
  }
  return rest.replace(/^\s+/, "");
}
