import "server-only";
import type { SavedBuild, TalentBuild } from "@/features/builds/types";
/** Future Turso adapter. The owner comes from the verified server session. */
export interface BuildRepository {
  listForOwner(ownerId: string): Promise<SavedBuild[]>;
  findForOwner(id: string, ownerId: string): Promise<SavedBuild | null>;
  saveForOwner(
    ownerId: string,
    input: {
      id?: string;
      name: string;
      build: TalentBuild;
      visibility: SavedBuild["visibility"];
    },
  ): Promise<SavedBuild>;
  deleteForOwner(id: string, ownerId: string): Promise<void>;
}
