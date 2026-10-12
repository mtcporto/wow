import { Suspense } from "react";
import { Auctions } from "@/features/game-data/auctions";
export default function Page() {
  return (
    <Suspense fallback={<main className="loading">Loading…</main>}>
      <Auctions />
    </Suspense>
  );
}
