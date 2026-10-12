/** Stored builds are patch-specific; allocations need authoritative rule validation. */
export interface TalentBuild {
  schemaVersion: 1;
  gameVersion: string;
  region: "us" | "eu" | "kr" | "tw";
  classId: number;
  specializationId: number;
  talentTreeId: number;
  heroTreeId: number | null;
  characterLevel: number;
  allocations: Record<string, { rank: number; choiceTalentId?: number }>;
}
export interface SavedBuild {
  id: string;
  ownerId: string;
  name: string;
  build: TalentBuild;
  visibility: "private" | "unlisted" | "public";
  createdAt: string;
  updatedAt: string;
}
