import { Suspense } from "react";
import { Characters } from "@/features/game-data/characters";
export default function Page() {
  return (
    <Suspense fallback={<main className="loading">Loading…</main>}>
      <Characters />
    </Suspense>
  );
}
