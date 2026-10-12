"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { LanguageSelector } from "@/components/language-selector";
import { fetchBlizzard } from "@/lib/blizzard/client";
import { assetPath } from "@/lib/paths";
import { classIconMap, classDescriptionsEn, classDescriptionsPt } from "./data";
interface PlayableClass {
  id: number;
  name: string;
}
const groups = [
  {
    pt: "Missões, coleções e jogadores",
    en: "Quests, collections and players",
    links: [
      ["Quests", "Missões", "/quests"],
      ["Reputations", "Reputações", "/reputations"],
      ["Toys", "Brinquedos", "/toys"],
      ["Auctions", "Leilões", "/auctions"],
      ["Rankings", "Rankings", "/rankings"],
      ["Character profiles", "Perfis de personagens", "/characters"],
    ],
  },
  {
    pt: "Classes e especializações",
    en: "Classes and specializations",
    links: [
      ["Specializations", "Especializações", "browse=specializations"],
      ["Talents", "Talentos", "browse=talents"],
      ["PvP Talents", "Talentos PvP", "browse=pvp-talents"],
    ],
  },
  {
    pt: "Coleções e companheiros",
    en: "Collections and companions",
    links: [
      ["Races by class", "Raças por classe", "browse=races"],
      ["Mounts", "Montarias", "mounts=1"],
      ["Class mounts", "Montarias de classe", "browse=mounts"],
      ["Battle pets", "Mascotes de batalha", "pets"],
      ["Hunter companions", "Companheiros de Hunter", "hunters=1"],
      ["Appearance sets", "Conjuntos de transmog", "transmog=1"],
    ],
  },
  {
    pt: "Mundo",
    en: "World",
    links: [
      ["Realms", "Reinos", "realms=1"],
      ["Regions", "Regiões", "regions=1"],
      ["Journal", "Journal", "journal=1"],
      ["Dungeons", "Masmorras", "journal=1&kind=dungeons"],
      ["Raids", "Raides", "journal=1&kind=raids"],
    ],
  },
  {
    pt: "Criação e coleções",
    en: "Crafting and collections",
    links: [
      ["Professions and recipes", "Profissões e receitas", "professions=1"],
      ["Housing and decor", "Casas e decoração", "housing=decor"],
      ["Rooms", "Ambientes", "housing=rooms"],
      ["Fixtures", "Estruturas", "housing=fixtures"],
      ["Achievements", "Conquistas", "achievements=1"],
    ],
  },
  {
    pt: "Mídia oficial",
    en: "Official media",
    links: [
      ["Official gallery", "Galeria oficial", "media=all"],
      ["Videos and cinematics", "Vídeos e cinematics", "media=video"],
      ["Comics", "Quadrinhos", "media=comic"],
      ["Short stories", "Contos", "media=short-story"],
      ["Audio", "Áudio", "media=audio"],
    ],
  },
];
export function ClassCatalogue() {
  const { locale } = useLocale(),
    pt = locale === "pt_BR";
  const [result, setResult] = useState<{
    locale: string;
    classes: PlayableClass[];
    error?: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchBlizzard<{ classes: PlayableClass[] }>(
      "playable-class/index",
      locale,
      controller.signal,
    )
      .then((data) => setResult({ locale, classes: data.classes }))
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ locale, classes: [], error: error.message });
      });
    return () => controller.abort();
  }, [locale, retry]);
  const ready = result?.locale === locale;
  const descriptions = pt ? classDescriptionsPt : classDescriptionsEn;
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
      <h1 id="page-title">
        {pt ? "Classes jogáveis (WoW)" : "Playable Classes (WoW)"}
      </h1>
      <p className="intro" id="catalogue-intro">
        {pt
          ? "Encontre seu lugar em Azeroth. Conheça as classes e descubra seu próximo estilo de jogo."
          : "Find your place in Azeroth. Discover the classes and your next playstyle."}
      </p>
      <div className="controls">
        <LanguageSelector />
      </div>
      <div
        id="output"
        className={!ready ? "loading" : result.error ? "error" : "class-grid"}
        aria-live="polite"
        aria-busy={!ready}
      >
        {!ready ? (
          pt ? (
            "Carregando…"
          ) : (
            "Loading…"
          )
        ) : result.error ? (
          <>
            <p>{result.error}</p>
            <button
              className="back-btn"
              onClick={() => setRetry((value) => value + 1)}
            >
              {pt ? "Tentar novamente" : "Try again"}
            </button>
          </>
        ) : (
          result.classes.map((cl) => (
            <a
              key={cl.id}
              className="class-card"
              data-class-id={cl.id}
              href={assetPath("/explore?class=" + cl.id)}
            >
              <strong>{cl.name}</strong>
              <img
                src={
                  "https://render.worldofwarcraft.com/us/icons/56/classicon_" +
                  classIconMap[cl.id] +
                  ".jpg"
                }
                alt=""
                width="56"
                height="56"
              />
              <p className="class-desc">{descriptions[cl.id]}</p>
            </a>
          ))
        )}
      </div>
      {ready && !result.error ? (
        <div className="feature-selector" id="feature-selector">
          <h3>{pt ? "Explore Azeroth" : "Explore Azeroth"}</h3>
          <p className="explorer-note">
            {pt
              ? "Escolha um caminho. Para especializações e talentos, comece com uma classe."
              : "Choose a path. For specializations and talents, start with a class."}
          </p>
          {groups.map((group) => (
            <div className="feature-category" key={group.en}>
              <div className="category-title">{pt ? group.pt : group.en}</div>
              <div className="feature-btn-group">
                {group.links.map(([en, br, query]) => (
                  <a
                    className="feature-btn"
                    key={query}
                    href={assetPath(
                      query.startsWith("/")
                        ? query
                        : query === "pets"
                          ? "/pets"
                          : "/explore?" + query,
                    )}
                  >
                    {pt ? br : en}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}
