"use client";
import { useLocale } from "./locale-provider";
import { assetPath } from "@/lib/paths";
const links = [
  ["classes", "/", "Classes", "Classes"],
  ["pets", "/pets", "Mascotes", "Battle pets"],
  ["mounts", "/explore?mounts=1", "Montarias", "Mounts"],
  ["journal", "/explore?journal=1", "Journal", "Journal"],
  ["professions", "/explore?professions=1", "Profissões", "Professions"],
  ["transmog", "/explore?transmog=1", "Transmog", "Transmog"],
  ["housing", "/explore?housing=decor", "Casas", "Housing"],
  ["achievements", "/explore?achievements=1", "Conquistas", "Achievements"],
  ["realms", "/explore?realms=1", "Reinos", "Realms"],
  ["media", "/explore?media=all", "Mídia", "Media"],
];
export function SiteHeader() {
  const { locale } = useLocale();
  return (
    <header className="site-header">
      <a className="site-brand" href={assetPath("/")}>
        <span className="brand-symbol" aria-hidden="true">
          W
        </span>
        <span>
          Azeroth<span className="brand-caption">EXPLORER</span>
        </span>
      </a>
      <nav aria-label={locale === "pt_BR" ? "Catálogo" : "Catalogue"}>
        {links.map(([key, path, pt, en]) => (
          <a key={key} href={assetPath(path)} data-nav={key}>
            {locale === "pt_BR" ? pt : en}
          </a>
        ))}
        <details className="more-navigation">
          <summary>{locale === "pt_BR" ? "Mais" : "More"}</summary>
          <div>
            {[
              ["quests", "Missões", "Quests"],
              ["reputations", "Reputações", "Reputations"],
              ["toys", "Brinquedos", "Toys"],
              ["auctions", "Leilões", "Auctions"],
              ["rankings", "Rankings", "Rankings"],
              ["characters", "Personagens", "Characters"],
            ].map(([path, pt, en]) => (
              <a key={path} href={assetPath("/" + path)}>
                {locale === "pt_BR" ? pt : en}
              </a>
            ))}
          </div>
        </details>
      </nav>
    </header>
  );
}
