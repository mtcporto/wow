import { Suspense } from "react";
import { Toys } from "@/features/game-data/catalogues";
export default function Page() {
  return (
    <Suspense fallback={<main className="loading">Loading…</main>}>
      <Toys />
    </Suspense>
  );
}
