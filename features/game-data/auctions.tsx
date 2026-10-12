"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FeatureShell, LoadState, Tags, useText } from "./common";
import { ItemLink } from "./item-link";
import { AuctionItemSearch } from "./auction-item-search";
import { useResource } from "./use-resource";
import { list, money, num, obj, positive, str } from "./data";
import { assetPath } from "@/lib/paths";
export function Auctions() {
  const [showTime, setShowTime] = useState(false);
  const p = useSearchParams(),
    t = useText(),
    item = positive(p.get("item")),
    query = (p.get("q") || "").trim(),
    page = positive(p.get("page")) || 1,
    region = ["us", "eu", "kr", "tw"].includes(p.get("region") || "")
      ? p.get("region")!
      : "us",
    source = p.get("source") === "realm" ? "realm" : "commodities",
    realm = (p.get("realm") || "azralon").toLowerCase();
  const realmData = useResource(
    item && source === "realm" && /^[a-z0-9-]+$/.test(realm)
      ? "realm/" + realm
      : null,
    region,
  );
  const match = str(obj(realmData.data?.connected_realm).href).match(
      /connected-realm\/(\d+)/,
    ),
    connected = match ? Number(match[1]) : 0;
  const offers = useResource(
      item && (source === "commodities" || connected)
        ? source === "commodities"
          ? "auctions/commodities"
          : "connected-realm/" + connected + "/auctions"
        : null,
      region,
      { item: String(item), page: String(page) },
    ),
    detail = useResource(item ? "item/" + item : null, region);
  const data = offers.data,
    rows = list(data?.auctions);
  const url = (next: number) =>
    "/auctions?" +
    new URLSearchParams({
      region,
      source,
      realm,
      item: String(item),
      q: query,
      page: String(next),
    });
  return (
    <FeatureShell
      title={t("Leilões", "Auction house")}
      intro={t(
        "Busque um item pelo nome e escolha qual consultar. Mercadorias são regionais; equipamentos usam o grupo de reinos conectado.",
        "Search for an item by name and choose it to view offers. Commodities are region-wide; equipment uses the connected realm group.",
      )}
    >
      <form className="native-query-form" action={assetPath("/auctions")}>
        <label>
          {t("Região", "Region")}
          <select name="region" defaultValue={region}>
            {["us", "eu", "kr", "tw"].map((value) => (
              <option key={value} value={value}>
                {value.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Mercado", "Market")}
          <select name="source" defaultValue={source}>
            <option value="commodities">
              {t("Mercadorias regionais", "Regional commodities")}
            </option>
            <option value="realm">
              {t("Reino conectado", "Connected realm")}
            </option>
          </select>
        </label>
        <label>
          {t("Reino (para ofertas locais)", "Realm (for local auctions)")}
          <input
            name="realm"
            defaultValue={realm}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={80}
          />
        </label>
        <label>
          {t("Nome do item", "Item name")}
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t("Ex.: Minério de Cobre", "e.g. Copper Ore")}
            minLength={2}
            maxLength={80}
            required
          />
        </label>
        <button className="back-btn">{t("Buscar item", "Find item")}</button>
      </form>
      {!item && query.length >= 2 ? (
        <AuctionItemSearch
          query={query}
          region={region}
          source={source}
          realm={realm}
        />
      ) : null}
      {item ? (
        <>
          <LoadState loading={detail.loading} error={detail.error}>
            {detail.data ? (
              <ItemLink
                item={{
                  id: item,
                  name: detail.data.name,
                  quality: detail.data.quality,
                }}
                region={region}
              />
            ) : null}
          </LoadState>
          <LoadState
            loading={
              source === "realm"
                ? realmData.loading || offers.loading
                : offers.loading
            }
            error={realmData.error || offers.error}
            retry={offers.refresh}
          >
            {data ? (
              <>
                <Tags
                  values={[
                    num(data.total) + " " + t("ofertas", "offers"),
                    num(data.quantity) + " " + t("unidades", "units"),
                    data.lowestUnitPrice !== null
                      ? t("Menor compra unitária: ", "Lowest unit buyout: ") +
                        money(num(data.lowestUnitPrice))
                      : "",
                  ]}
                />
                <p className="explorer-note">
                  {t("Consulta em ", "Fetched at ") +
                    new Date(str(data.fetchedAt)).toLocaleString()}
                  {str(data.snapshotAt)
                    ? " · " +
                      t("Snapshot da Blizzard: ", "Blizzard snapshot: ") +
                      new Date(str(data.snapshotAt)).toLocaleString()
                    : ""}
                  .{" "}
                  {t(
                    "Os preços podem mudar até a compra.",
                    "Prices may change before purchase.",
                  )}
                </p>
                {rows.length ? (
                  <>
                    <label className="auction-display-options">
                      <input
                        type="checkbox"
                        checked={showTime}
                        onChange={(event) => setShowTime(event.target.checked)}
                      />
                      {t("Mostrar tempo restante", "Show time left")}
                    </label>
                    <div className="loot-table-scroll">
                      <table className="loot-table">
                        <thead>
                          <tr>
                            <th>{t("Quantidade", "Quantity")}</th>
                            <th>{t("Compra unitária", "Unit buyout")}</th>
                            <th>{t("Compra total", "Total buyout")}</th>
                            {source === "realm" ? (
                              <th>{t("Lance", "Bid")}</th>
                            ) : null}
                            {showTime ? (
                              <th>{t("Tempo restante", "Time left")}</th>
                            ) : null}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, index) => (
                            <tr key={num(row.id) || index}>
                              <td>{num(row.quantity)}</td>
                              <td>
                                {num(row.unit_price)
                                  ? money(num(row.unit_price))
                                  : num(row.buyout)
                                    ? money(
                                        num(row.buyout) /
                                          Math.max(1, num(row.quantity)),
                                      )
                                    : "—"}
                              </td>
                              <td>
                                {num(row.buyout)
                                  ? money(num(row.buyout))
                                  : num(row.unit_price)
                                    ? money(
                                        num(row.unit_price) * num(row.quantity),
                                      )
                                    : "—"}
                              </td>
                              {source === "realm" ? (
                                <td>
                                  {num(row.bid) ? money(num(row.bid)) : "—"}
                                </td>
                              ) : null}
                              {showTime ? (
                                <td>
                                  {{
                                    SHORT: t("Curto", "Short"),
                                    MEDIUM: t("Médio", "Medium"),
                                    LONG: t("Longo", "Long"),
                                    VERY_LONG: t("Muito longo", "Very long"),
                                  }[str(row.time_left)] || "—"}
                                </td>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p>
                    {t(
                      "Nenhuma oferta encontrada para este item neste mercado.",
                      "No offers found for this item in this market.",
                    )}
                  </p>
                )}
                {data.truncated ? (
                  <p>
                    {t(
                      "Mostrando as 20.000 ofertas de menor preço disponíveis nesta consulta.",
                      "Showing the 20,000 lowest-price offers retained for this lookup.",
                    )}
                  </p>
                ) : null}
                {num(data.pages) > 1 ? (
                  <div className="native-pagination">
                    {page > 1 ? (
                      <a className="back-btn" href={assetPath(url(page - 1))}>
                        {t("Anterior", "Previous")}
                      </a>
                    ) : null}
                    <span>
                      {num(data.page)} / {num(data.pages)}
                    </span>
                    {num(data.page) < num(data.pages) ? (
                      <a
                        className="back-btn"
                        href={assetPath(url(num(data.page) + 1))}
                      >
                        {t("Próxima", "Next")}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </LoadState>
        </>
      ) : null}
    </FeatureShell>
  );
}
