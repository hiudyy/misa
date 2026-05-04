/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { WASocket } from "baileys";

export interface EventContext<T = unknown> {
  misa: WASocket;
  data: T;
}

export interface Event<T = unknown> {
  event: string;
  name: string;
  execute: (context: EventContext<T>) => Promise<void>;
}
