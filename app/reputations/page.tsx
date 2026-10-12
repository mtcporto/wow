import { Suspense } from "react";
import { Reputations } from "@/features/game-data/catalogues";
export default function Page() {
  return (
    <Suspense fallback={<main className="loading">Loading…</main>}>
      <Reputations />
    </Suspense>
  );
}
