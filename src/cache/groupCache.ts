/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
import { GroupMetadata, GroupParticipant, ParticipantAction, WASocket } from "baileys";
import { toLID } from "../helpers/toLID.js";

class GroupCache {
  private readonly cache = new Map<string, GroupMetadata>();

  private async normalizeParticipant(participant: GroupParticipant, misa: WASocket): Promise<GroupParticipant | null> {
    const lid = await toLID(participant.id, misa);
    if (!lid) return null;

    return { ...participant, id: lid };
  }

  private async normalizeParticipants(participants: GroupParticipant[], misa: WASocket): Promise<GroupParticipant[]> {
    const normalized = await Promise.all(participants.map((participant) => this.normalizeParticipant(participant, misa)));
    return normalized.filter((participant): participant is GroupParticipant => participant !== null);
  }

  async set(data: GroupMetadata, misa: WASocket): Promise<void> {
    const participants = await this.normalizeParticipants(data.participants, misa);
    this.cache.set(data.id, { ...data, participants });
  }

  get(id: string): GroupMetadata | undefined {
    return this.cache.get(id);
  }

  async patch(id: string, partial: Partial<GroupMetadata>, misa: WASocket): Promise<void> {
    const existing = this.cache.get(id);
    if (existing) {
      const participants = partial.participants
        ? await this.normalizeParticipants(partial.participants, misa)
        : existing.participants;

      this.cache.set(id, { ...existing, ...partial, participants });
    }
  }

  async updateParticipants(id: string, participants: GroupParticipant[], action: ParticipantAction, misa: WASocket): Promise<void> {
    const group = this.cache.get(id);
    if (!group) return;

    const normalizedParticipants = await this.normalizeParticipants(participants, misa);
    let updated = [...group.participants];

    if (action === "add") {
      const newOnes = normalizedParticipants.filter((p) => !updated.some((u) => u.id === p.id));
      updated = [...updated, ...newOnes];
    } else if (action === "remove") {
      const ids = new Set(normalizedParticipants.map((p) => p.id));
      updated = updated.filter((p) => !ids.has(p.id));
    } else if (action === "promote") {
      const ids = new Set(normalizedParticipants.map((p) => p.id));
      updated = updated.map((p) => (ids.has(p.id) ? { ...p, admin: "admin" as const, isAdmin: true } : p));
    } else if (action === "demote") {
      const ids = new Set(normalizedParticipants.map((p) => p.id));
      updated = updated.map((p) => (ids.has(p.id) ? { ...p, admin: null, isAdmin: false } : p));
    } else if (action === "modify") {
      const map = new Map(normalizedParticipants.map((p) => [p.id, p]));
      updated = updated.map((p) => (map.has(p.id) ? { ...p, ...map.get(p.id) } : p));
    }

    this.cache.set(id, { ...group, participants: updated });
  }

  async ensure(id: string, misa: WASocket): Promise<GroupMetadata | undefined> {
    if (this.cache.has(id)) return this.cache.get(id);

    try {
      const meta = await misa.groupMetadata(id);
      await this.set(meta, misa);
      return this.cache.get(id);
    } catch {
      return undefined;
    }
  }

  async ensureAndPatch(id: string, partial: Partial<GroupMetadata>, misa: WASocket): Promise<void> {
    await this.ensure(id, misa);
    await this.patch(id, partial, misa);
  }

  async ensureAndUpdateParticipants(id: string, participants: GroupParticipant[], action: ParticipantAction, misa: WASocket): Promise<void> {
    await this.ensure(id, misa);
    await this.updateParticipants(id, participants, action, misa);
  }

  registerEvents(misa: WASocket): void {
    misa.ev.on("groups.upsert", (groups) => {
      for (const group of groups) void this.set(group, misa);
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
