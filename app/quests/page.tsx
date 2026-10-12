import { Suspense } from "react";
import { Quests } from "@/features/game-data/catalogues";
export default function Page() {
  return (
    <Suspense fallback={<main className="loading">Loading…</main>}>
      <Quests />
    </Suspense>
  );
}
