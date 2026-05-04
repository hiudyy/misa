/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { GroupMetadata, GroupParticipant, ParticipantAction, WASocket } from "baileys";

class GroupCache {
  private readonly cache = new Map<string, GroupMetadata>();

  set(data: GroupMetadata): void {
    this.cache.set(data.id, data);
  }

  get(id: string): GroupMetadata | undefined {
    return this.cache.get(id);
  }

  patch(id: string, partial: Partial<GroupMetadata>): void {
    const existing = this.cache.get(id);
    if (existing) {
      this.cache.set(id, { ...existing, ...partial });
    }
  }

  updateParticipants(id: string, participants: GroupParticipant[], action: ParticipantAction): void {
    const group = this.cache.get(id);
    if (!group) return;

    let updated = [...group.participants];

    if (action === "add") {
      const newOnes = participants.filter((p) => !updated.some((u) => u.id === p.id));
      updated = [...updated, ...newOnes];
    } else if (action === "remove") {
      const ids = new Set(participants.map((p) => p.id));
      updated = updated.filter((p) => !ids.has(p.id));
    } else if (action === "promote") {
      const ids = new Set(participants.map((p) => p.id));
      updated = updated.map((p) => (ids.has(p.id) ? { ...p, admin: "admin" as const, isAdmin: true } : p));
    } else if (action === "demote") {
      const ids = new Set(participants.map((p) => p.id));
      updated = updated.map((p) => (ids.has(p.id) ? { ...p, admin: null, isAdmin: false } : p));
    } else if (action === "modify") {
      const map = new Map(participants.map((p) => [p.id, p]));
      updated = updated.map((p) => (map.has(p.id) ? { ...p, ...map.get(p.id) } : p));
    }

    this.cache.set(id, { ...group, participants: updated });
  }

  async ensure(id: string, misa: WASocket): Promise<GroupMetadata | undefined> {
    if (this.cache.has(id)) return this.cache.get(id);

    try {
      const meta = await misa.groupMetadata(id);
      this.set(meta);
      return meta;
    } catch {
      return undefined;
    }
  }

  async ensureAndPatch(id: string, partial: Partial<GroupMetadata>, misa: WASocket): Promise<void> {
    await this.ensure(id, misa);
    this.patch(id, partial);
  }

  async ensureAndUpdateParticipants(id: string, participants: GroupParticipant[], action: ParticipantAction, misa: WASocket): Promise<void> {
    await this.ensure(id, misa);
    this.updateParticipants(id, participants, action);
  }

  registerEvents(misa: WASocket): void {
    misa.ev.on("groups.upsert", (groups) => {
      for (const group of groups) this.set(group);
    });

    misa.ev.on("groups.update", (updates) => {
      for (const update of updates) {
        if (update.id) void this.ensureAndPatch(update.id, update, misa);
      }
    });

    misa.ev.on("group-participants.update", ({ id, participants, action }) => {
      void this.ensureAndUpdateParticipants(id, participants, action, misa);
    });
  }
}

export type { GroupCache };
export const groupCache = new GroupCache();
