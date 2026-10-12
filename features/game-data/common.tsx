"use client";
import { useState, type ReactNode } from "react";
import { LanguageSelector } from "@/components/language-selector";
import { useLocale } from "@/components/locale-provider";
import { assetPath } from "@/lib/paths";
import { label, num, str, type RecordValue } from "./data";
export function useText() {
  const { locale } = useLocale();
  return (pt: string, en: string) => (locale === "pt_BR" ? pt : en);
}
export function FeatureShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main id="main-content">
      <a href={assetPath("/")} className="back-btn">
        ← Azeroth Explorer
      </a>
      <p className="hero-kicker">WORLD OF WARCRAFT</p>
      <h1>{title}</h1>
      {intro ? <p className="intro">{intro}</p> : null}
      <div className="controls">
        <LanguageSelector />
      </div>
      {children}
    </main>
  );
}
export function LoadState({
  loading,
  error,
  retry,
  children,
}: {
  loading: boolean;
  error?: string | null;
  retry?: () => void;
  children: ReactNode;
}) {
  const t = useText();
  if (loading)
    return (
      <p className="loading" role="status">
        {t("Carregando…", "Loading…")}
      </p>
    );
  if (error)
    return (
      <div className="error" role="alert">
        <p>{error}</p>
        {retry ? (
          <button className="back-btn" onClick={retry}>
            {t("Tentar novamente", "Try again")}
          </button>
        ) : null}
      </div>
    );
  return <>{children}</>;
}
export function Tags({ values }: { values: string[] }) {
  return (
    <div className="tags">
      {values.filter(Boolean).map((value, index) => (
        <span className="tag" key={index}>
          {value}
        </span>
      ))}
    </div>
  );
}
export function ReferenceList({
  entries,
  href,
}: {
  entries: RecordValue[];
  href: (entry: RecordValue) => string;
}) {
  const t = useText(),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1);
  const norm = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const matches = entries.filter((entry) =>
    norm(label(entry.name) || String(entry.id)).includes(norm(query)),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(matches.length / 24)));
  return (
    <div className="native-catalogue">
      <label className="loot-search">
        {t("Buscar", "Search")}
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
      </label>
      <p className="loot-count">
        {matches.length} {t("resultados", "results")}
      </p>
      <div className="relation-grid">
        {matches.slice((current - 1) * 24, current * 24).map((entry) => (
          <a
            className="relation-card"
            key={str(entry.keyId) || num(entry.id) || str(entry.name)}
            href={assetPath(href(entry))}
          >
            <h3>{label(entry.name) || t("ID ", "ID ") + entry.id}</h3>
          </a>
        ))}
      </div>
      {!matches.length ? <p>{t("Nenhum resultado.", "No results.")}</p> : null}
      {matches.length > 24 ? (
        <div className="native-pagination">
          <button
            className="back-btn"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            {t("Anterior", "Previous")}
          </button>
          <span>
            {current} / {Math.ceil(matches.length / 24)}
          </span>
          <button
            className="back-btn"
            disabled={current * 24 >= matches.length}
            onClick={() => setPage(current + 1)}
          >
            {t("Próxima", "Next")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
export function RegionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useText();
  return (
    <label>
      {t("Região", "Region")}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {["us", "eu", "kr", "tw"].map((region) => (
          <option key={region} value={region}>
            {region.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
