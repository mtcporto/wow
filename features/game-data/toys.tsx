"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { assetPath } from "@/lib/paths";
import { ItemLink } from "./item-link";
import { LoadState, useText } from "./common";
import { quality } from "./data";
interface Toy {
  id: number;
  itemId: number;
  name: { en_US: string; pt_BR: string };
  quality: string;
  icon: string;
  source: string;
}
interface Catalogue {
  updatedAt: string;
  toys: Toy[];
  sourceLabels: Record<string, { en_US: string; pt_BR: string }>;
}
export function ToyCatalogue() {
  const { locale } = useLocale(),
    t = useText();
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null),
    [error, setError] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const [search, setSearch] = useState(""),
    [source, setSource] = useState(""),
    [rarity, setRarity] = useState(""),
    [page, setPage] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    fetch(assetPath("/data/toys.json"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw Error("catalogue_unavailable");
        return response.json() as Promise<Catalogue>;
      })
      .then((value) => {
        if (!controller.signal.aborted) {
          setCatalogue(value);
          setError(null);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("catalogue_unavailable");
      });
    return () => controller.abort();
  }, [retry]);
  const norm = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const entries = (catalogue?.toys || [])
    .filter(
      (toy) =>
        (!source || toy.source === source) &&
        (!rarity || toy.quality === rarity) &&
        (norm(toy.name[locale]).includes(norm(search)) ||
          String(toy.itemId) === search.trim()),
    )
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale]));
  const current = Math.min(page, Math.max(1, Math.ceil(entries.length / 24)));
  const qualityLabels: Record<string, string> = {
    POOR: t("Inferior", "Poor"),
    COMMON: t("Comum", "Common"),
    UNCOMMON: t("Incomum", "Uncommon"),
    RARE: t("Raro", "Rare"),
    EPIC: t("Épico", "Epic"),
    LEGENDARY: t("Lendário", "Legendary"),
    ARTIFACT: t("Artefato", "Artifact"),
    HEIRLOOM: t("Herança", "Heirloom"),
  };
  return (
    <LoadState
      loading={!catalogue && !error}
      error={
        error
          ? t(
              "Não foi possível carregar os brinquedos.",
              "Unable to load toys.",
            )
          : null
      }
      retry={() => {
        setError(null);
        setRetry((value) => value + 1);
      }}
    >
      <div className="native-query-form toy-filters">
        <label>
          {t("Buscar por nome ou ID do item", "Search by name or item ID")}
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          {t("Fonte de obtenção", "Acquisition source")}
          <select
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("Todas as fontes", "All sources")}</option>
            {Object.entries(catalogue?.sourceLabels || {})
              .sort((a, b) => a[1][locale].localeCompare(b[1][locale]))
              .map(([type, names]) => (
                <option key={type} value={type}>
                  {names[locale]}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("Qualidade", "Quality")}
          <select
            value={rarity}
            onChange={(event) => {
              setRarity(event.target.value);
              setPage(1);
            }}
          >
            <option value="">
              {t("Todas as qualidades", "All qualities")}
            </option>
            {[...new Set(catalogue?.toys.map((toy) => toy.quality) || [])]
              .filter(Boolean)
              .map((value) => (
                <option key={value} value={value}>
                  {qualityLabels[value] || value}
                </option>
              ))}
          </select>
        </label>
      </div>
      <p className="loot-count">
        {entries.length} {t("brinquedos", "toys")}
      </p>
      <div className="toy-items">
        {entries.slice((current - 1) * 24, current * 24).map((toy) => (
          <article className="toy-item" key={toy.id}>
            <ItemLink
              item={{
                id: toy.itemId,
                name: toy.name[locale],
                quality: { type: toy.quality },
              }}
              icon={toy.icon}
            />
            <a className="toy-source" href={assetPath("/toys?id=" + toy.id)}>
              {catalogue?.sourceLabels[toy.source]?.[locale] ||
                t("Ver obtenção", "View acquisition")}
            </a>
            <span
              className="toy-quality"
              style={{ color: quality({ type: toy.quality }) }}
            >
              {qualityLabels[toy.quality] || ""}
            </span>
          </article>
        ))}
      </div>
      {!entries.length ? (
        <p>{t("Nenhum brinquedo encontrado.", "No toys found.")}</p>
      ) : null}
      {entries.length > 24 ? (
        <div className="native-pagination">
          <button
            className="back-btn"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            {t("Anterior", "Previous")}
          </button>
          <span>
            {current} / {Math.ceil(entries.length / 24)}
          </span>
          <button
            className="back-btn"
            disabled={current * 24 >= entries.length}
            onClick={() => setPage(current + 1)}
          >
            {t("Próxima", "Next")}
          </button>
        </div>
      ) : null}
    </LoadState>
  );
}
