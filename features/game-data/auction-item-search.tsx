"use client";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { assetPath } from "@/lib/paths";
import { useResource } from "./use-resource";
import { LoadState, useText } from "./common";
import {
  label,
  list,
  num,
  obj,
  positive,
  quality,
  str,
  type RecordValue,
  type Value,
} from "./data";
export function AuctionItemSearch({
  query,
  region,
  source,
  realm,
}: {
  query: string;
  region: string;
  source: string;
  realm: string;
}) {
  const p = useSearchParams(),
    t = useText(),
    page = positive(p.get("searchPage")) || 1,
    r = useResource("search/item", region, { q: query, page: String(page) });
  function url(next: number) {
    return assetPath(
      "/auctions?" +
        new URLSearchParams({
          q: query,
          region,
          source,
          realm,
          searchPage: String(next),
        }),
    );
  }
  return (
    <section
      className="auction-item-search"
      aria-labelledby="auction-search-title"
    >
      <h2 id="auction-search-title">{t("Escolha o item", "Choose an item")}</h2>
      <p className="explorer-note">
        {t(
          "Selecione o item para consultar as ofertas no mercado escolhido.",
          "Select an item to look up offers in the chosen market.",
        )}
      </p>
      <LoadState {...r} retry={r.refresh}>
        <div className="auction-search-items">
          {list(r.data?.results).map((result) => (
            <SearchItem
              key={num(obj(result.data).id)}
              item={obj(result.data)}
              region={region}
              source={source}
              realm={realm}
              query={query}
            />
          ))}
        </div>
        {r.data && !list(r.data.results).length ? (
          <p>
            {t(
              "Nenhum item encontrado. Tente outro nome no idioma selecionado.",
              "No items found. Try another name in the selected language.",
            )}
          </p>
        ) : null}
        {num(r.data?.pageCount) > 1 ? (
          <div className="native-pagination">
            <a
              className="back-btn"
              href={url(page - 1)}
              aria-disabled={page === 1}
              style={
                page === 1 ? { pointerEvents: "none", opacity: 0.4 } : undefined
              }
            >
              {t("Anterior", "Previous")}
            </a>
            <span>
              {num(r.data?.page)} / {num(r.data?.pageCount)}
            </span>
            {page < num(r.data?.pageCount) ? (
              <a className="back-btn" href={url(page + 1)}>
                {t("Próxima", "Next")}
              </a>
            ) : null}
          </div>
        ) : null}
      </LoadState>
    </section>
  );
}
function SearchItem({
  item,
  region,
  source,
  realm,
  query,
}: {
  item: RecordValue;
  region: string;
  source: string;
  realm: string;
  query: string;
}) {
  const { locale } = useLocale(),
    t = useText(),
    media = useResource("media/item/" + num(item.id), region),
    icon = list(media.data?.assets).find((asset) => asset.key === "icon");
  const localized = (value: Value | undefined) =>
    label(value) || str(obj(value)[locale]);
  const color = quality(item.quality);
  return (
    <a
      className="auction-search-item"
      href={assetPath(
        "/auctions?" +
          new URLSearchParams({
            item: String(num(item.id)),
            q: query,
            region,
            source,
            realm,
          }),
      )}
    >
      <span className="wow-item-icon" style={{ borderColor: color }}>
        {str(icon?.value).startsWith("https://") ? (
          <img src={str(icon?.value)} alt="" width={48} height={48} />
        ) : null}
      </span>
      <span>
        <strong style={{ color }}>{localized(item.name)}</strong>
        <small>
          {[
            localized(obj(item.item_class).name),
            localized(obj(item.item_subclass).name),
            num(item.level) ? t("Nível ", "Level ") + num(item.level) : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </span>
    </a>
  );
}
