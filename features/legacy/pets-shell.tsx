import { LanguageSelector } from "@/components/language-selector";
import { assetPath } from "@/lib/paths";
export function PetsShell() {
  return (
    <main id="main-content">
      <img
        className="expansion-logo"
        src={assetPath("/assets/wow-midnight.webp")}
        alt="World of Warcraft: Midnight"
        width="180"
        height="150"
      />
      <p className="hero-kicker">WORLD OF WARCRAFT</p>
      <h1 id="page-title">Battle Pets</h1>
      <p className="intro" id="catalogue-intro"></p>
      <div className="controls">
        <a href={assetPath("/")} className="back-btn" id="back-btn">
          ← Back to Classes
        </a>
        <LanguageSelector />
      </div>

      <div id="breadcrumbs" className="breadcrumbs hidden"></div>

      <div id="family-nav" className="family-nav hidden"></div>
      <div id="category-nav" className="family-nav hidden"></div>

      <div className="pet-list-header hidden" id="pet-list-header">
        <h2 id="current-title" className="family-heading" style={{ margin: 0 }}>
          All Pets
        </h2>
        <div className="pet-count" id="pet-count">
          0 pets
        </div>
      </div>

      <div id="output" className="loading" aria-live="polite" aria-busy="true">
        Loading...
      </div>

      <div id="pagination" className="pagination hidden"></div>

      <div id="background-loading" className="background-loading hidden">
        <span className="loading-spinner"></span>
        <span id="loading-text">Loading additional pets...</span>
      </div>
    </main>
  );
}
