import { EncounterMap } from "@/features/maps/encounter-map";
import { Suspense } from "react";
import { CatalogueRuntime } from "@/features/legacy/runtime";
import { LanguageSelector } from "@/components/language-selector";
import { assetPath } from "@/lib/paths";
export const metadata = { title: "Explore Azeroth" };
export default function ExplorePage() {
  return (
    <main id="main-content">
      <a className="back-btn" id="explorer-back" href={assetPath("/")}>
        ← Classes
      </a>
      <div className="explorer-introduction">
        <figure id="explorer-art" className="encounter-portrait" hidden />
        <div className="explorer-summary">
          <div className="explorer-heading">
            <div>
              <p className="hero-kicker">AZEROTH EXPLORER</p>
              <h1 id="page-title">Explore Azeroth</h1>
              <p className="intro" id="explorer-intro" />
              <div className="tags" id="explorer-meta" hidden />
            </div>
            <img id="explorer-icon" width="80" height="80" alt="" hidden />
          </div>
          <div className="controls">
            <LanguageSelector />
          </div>
        </div>
      </div>
      <Suspense fallback={null}>
        <EncounterMap />
      </Suspense>
      <div id="output" className="loading" aria-live="polite" aria-busy="true">
        Loading…
      </div>
      <Suspense>
        <CatalogueRuntime kind="explore" />
      </Suspense>
    </main>
  );
}
