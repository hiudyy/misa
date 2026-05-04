/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { getBotConfig } from "../config.js";

export async function isOwner(userLID: string): Promise<boolean> {
  const config = await getBotConfig();
  
  if (!config.ownerLID) {
    return false;
  }
  
  return userLID === config.ownerLID;
}
