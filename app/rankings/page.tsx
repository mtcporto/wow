import { Suspense } from "react";
import { Rankings } from "@/features/game-data/rankings";
export default function Page() {
  return (
    <Suspense fallback={<main className="loading">Loading…</main>}>
      <Rankings />
    </Suspense>
  );
}
