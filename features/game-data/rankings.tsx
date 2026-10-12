"use client";
import { useSearchParams } from "next/navigation";
import { FeatureShell, LoadState, Tags, useText } from "./common";
import { useResource } from "./use-resource";
import {
  label,
  list,
  num,
  obj,
  positive,
  profileLink,
  str,
  type RecordValue,
} from "./data";
import { assetPath } from "@/lib/paths";
export function Rankings() {
  const p = useSearchParams(),
    t = useText(),
    kind =
      p.get("kind") === "mythic"
        ? "mythic"
        : p.get("kind") === "raid"
          ? "raid"
          : "pvp",
    region = ["us", "eu", "kr", "tw"].includes(p.get("region") || "")
      ? p.get("region")!
      : "us";
  return (
    <FeatureShell
      title={t("Rankings", "Leaderboards")}
      intro={t(
        "Consulte rankings públicos por região, temporada e modalidade.",
        "Explore public leaderboards by region, season and activity.",
      )}
    >
      <nav className="native-tabs">
        {[
          ["pvp", "PvP"],
          ["mythic", t("Míticas+", "Mythic+")],
          ["raid", t("Salão da fama", "Hall of Fame")],
        ].map(([key, name]) => (
          <a
            key={key}
            href={assetPath("/rankings?kind=" + key + "&region=" + region)}
            className="back-btn"
            aria-current={kind === key ? "page" : undefined}
          >
            {name}
          </a>
        ))}
      </nav>
      {kind === "pvp" ? (
        <Pvp region={region} />
      ) : kind === "mythic" ? (
        <Mythic region={region} />
      ) : (
        <Raid region={region} />
      )}
    </FeatureShell>
  );
}
function Regions({ region }: { region: string }) {
  const t = useText();
  return (
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
  );
}
function PageLinks({ data }: { data: RecordValue }) {
  const p = useSearchParams(),
    t = useText(),
    page = num(data.page) || 1;
  function url(next: number) {
    const q = new URLSearchParams(p.toString());
    q.set("page", String(next));
    return assetPath("/rankings?" + q);
  }
  return num(data.pages) > 1 ? (
    <div className="native-pagination">
      {page > 1 ? (
        <a className="back-btn" href={url(page - 1)}>
          {t("Anterior", "Previous")}
        </a>
      ) : null}
      <span>
        {page} / {num(data.pages)} · {num(data.total)}{" "}
        {t("resultados", "results")}
      </span>
      {page < num(data.pages) ? (
        <a className="back-btn" href={url(page + 1)}>
          {t("Próxima", "Next")}
        </a>
      ) : null}
    </div>
  ) : null;
}
function Pvp({ region }: { region: string }) {
  const p = useSearchParams(),
    t = useText(),
    index = useResource("pvp-season/index", region),
    season =
      positive(p.get("season")) || num(obj(index.data?.current_season).id),
    brackets = useResource(
      season ? "pvp-season/" + season + "/pvp-leaderboard/index" : null,
      region,
    ),
    bracket = p.get("bracket") || "2v2",
    board = useResource(
      season ? "pvp-season/" + season + "/pvp-leaderboard/" + bracket : null,
      region,
      { page: p.get("page") || "1" },
    ),
    data = board.data;
  return (
    <>
      <LoadState {...index} retry={index.refresh}>
        <form className="native-query-form" action={assetPath("/rankings")}>
          <input type="hidden" name="kind" value="pvp" />
          <Regions region={region} />
          <label>
            {t("Temporada", "Season")}
            <select name="season" key={season} defaultValue={season}>
              {list(index.data?.seasons).map((entry) => (
                <option key={num(entry.id)} value={num(entry.id)}>
                  {num(entry.id)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Modalidade", "Bracket")}
            <select
              name="bracket"
              key={bracket + "-" + list(brackets.data?.leaderboards).length}
              defaultValue={bracket}
            >
              {list(brackets.data?.leaderboards).map((entry) => (
                <option key={str(entry.name)} value={str(entry.name)}>
                  {str(entry.name)}
                </option>
              ))}
            </select>
          </label>
          <button className="back-btn">
            {t("Ver ranking", "View ranking")}
          </button>
        </form>
      </LoadState>
      <LoadState {...board} retry={board.refresh}>
        {data ? (
          <>
            <Tags
              values={[
                t("Temporada ", "Season ") + season,
                label(data.name),
                region.toUpperCase(),
              ]}
            />
            <div className="loot-table-scroll">
              <table className="loot-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("Personagem", "Character")}</th>
                    <th>{t("Reino", "Realm")}</th>
                    <th>Rating</th>
                    <th>{t("Partidas", "Played")}</th>
                    <th>{t("Vitórias", "Won")}</th>
                    <th>{t("Derrotas", "Lost")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list(data.entries).map((entry, index) => {
                    const character = obj(entry.character),
                      stats = obj(entry.season_match_statistics);
                    return (
                      <tr key={index}>
                        <td>{num(entry.rank)}</td>
                        <td>
                          <a href={assetPath(profileLink(character, region))}>
                            {label(character.name)}
                          </a>
                        </td>
                        <td>{str(obj(character.realm).slug)}</td>
                        <td>{num(entry.rating)}</td>
                        <td>{num(stats.played)}</td>
                        <td>{num(stats.won)}</td>
                        <td>{num(stats.lost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!list(data.entries).length ? (
              <p>
                {t(
                  "Nenhuma classificação disponível nesta modalidade.",
                  "No entries are available for this bracket.",
                )}
              </p>
            ) : null}
            <PageLinks data={data} />
          </>
        ) : null}
      </LoadState>
    </>
  );
}
function Mythic({ region }: { region: string }) {
  const p = useSearchParams(),
    t = useText(),
    realm = (p.get("realm") || "azralon").toLowerCase(),
    r = useResource(
      /^[a-z0-9-]+$/.test(realm) ? "realm/" + realm : null,
      region,
    ),
    connected = Number(
      str(obj(r.data?.connected_realm).href).match(
        /connected-realm\/(\d+)/,
      )?.[1] || 0,
    );
  const index = useResource(
      connected
        ? "connected-realm/" + connected + "/mythic-leaderboard/index"
        : null,
      region,
    ),
    seasonIndex = useResource("mythic-keystone/season/index", region),
    seasonId = num(obj(seasonIndex.data?.current_season).id),
    season = useResource(
      seasonId ? "mythic-keystone/season/" + seasonId : null,
      region,
    );
  const choices = list(index.data?.current_leaderboards),
    activeIds = new Set(
      list(season.data?.dungeons).map((entry) => num(entry.id)),
    ),
    dungeon =
      positive(p.get("dungeon")) ||
      num(
        (choices.find((entry) => activeIds.has(num(entry.id))) || choices[0])
          ?.id,
      ),
    selected = choices.find((entry) => num(entry.id) === dungeon),
    period =
      positive(p.get("period")) ||
      Number(str(obj(selected?.key).href).match(/period\/(\d+)/)?.[1] || 0);
  const board = useResource(
      connected && dungeon && period
        ? "connected-realm/" +
            connected +
            "/mythic-leaderboard/" +
            dungeon +
            "/period/" +
            period
        : null,
      region,
      { page: p.get("page") || "1" },
    ),
    data = board.data;
  return (
    <>
      <form className="native-query-form" action={assetPath("/rankings")}>
        <input type="hidden" name="kind" value="mythic" />
        <Regions region={region} />
        <label>
          {t("Reino", "Realm")}
          <input
            name="realm"
            defaultValue={realm}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </label>
        <label>
          {t("Masmorra", "Dungeon")}
          <select name="dungeon" key={dungeon} defaultValue={dungeon}>
            {choices.map((entry) => (
              <option key={num(entry.id)} value={num(entry.id)}>
                {label(entry.name)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Período semanal", "Weekly period")}
          <input
            type="number"
            name="period"
            key={period}
            defaultValue={period || ""}
            min={1}
          />
        </label>
        <button className="back-btn">{t("Consultar", "Look up")}</button>
      </form>
      <LoadState
        loading={r.loading || index.loading || board.loading}
        error={r.error || index.error || board.error}
        retry={board.refresh}
      >
        {data ? (
          <>
            <Tags
              values={[
                label(data.map),
                t("Período ", "Period ") + data.period,
                realm,
              ]}
            />
            {num(data.period_start_timestamp) ? (
              <p className="explorer-note">
                {new Date(
                  num(data.period_start_timestamp),
                ).toLocaleDateString()}{" "}
                –{" "}
                {new Date(num(data.period_end_timestamp)).toLocaleDateString()}
              </p>
            ) : null}
            <div className="loot-table-scroll">
              <table className="loot-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("Nível da chave", "Keystone level")}</th>
                    <th>{t("Tempo", "Time")}</th>
                    <th>{t("Grupo", "Group")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list(data.leading_groups).map((entry, index) => {
                    const seconds = Math.round(num(entry.duration) / 1000);
                    return (
                      <tr key={index}>
                        <td>{num(entry.ranking)}</td>
                        <td>+{num(entry.keystone_level)}</td>
                        <td>
                          {Math.floor(seconds / 60)}:
                          {String(seconds % 60).padStart(2, "0")}
                        </td>
                        <td>
                          {list(entry.members).map((member, i) => (
                            <span key={i} className="ranking-member">
                              <a
                                href={assetPath(
                                  profileLink(obj(member.profile), region),
                                )}
                              >
                                {label(obj(member.profile).name)}
                              </a>
                              {num(obj(member.specialization).id) ? (
                                <a
                                  className="ranking-spec"
                                  href={assetPath(
                                    "/explore?spec=" +
                                      obj(member.specialization).id,
                                  )}
                                >
                                  {t("Talentos", "Talents")}
                                </a>
                              ) : null}
                            </span>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!list(data.leading_groups).length ? (
              <p>
                {t(
                  "Nenhum grupo registrado neste período.",
                  "No groups recorded for this period.",
                )}
              </p>
            ) : null}
            <PageLinks data={data} />
          </>
        ) : null}
      </LoadState>
    </>
  );
}
function Raid({ region }: { region: string }) {
  const p = useSearchParams(),
    t = useText(),
    raid = p.get("raid") || "castle-nathria",
    faction = p.get("faction") === "alliance" ? "alliance" : "horde",
    r = useResource("leaderboard/hall-of-fame/" + raid + "/" + faction, region);
  return (
    <>
      <form className="native-query-form" action={assetPath("/rankings")}>
        <input type="hidden" name="kind" value="raid" />
        <Regions region={region} />
        <label>
          {t("Raide (slug)", "Raid (slug)")}
          <input
            name="raid"
            defaultValue={raid}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
            maxLength={100}
          />
        </label>
        <label>
          {t("Facção", "Faction")}
          <select name="faction" defaultValue={faction}>
            <option value="horde">Horde</option>
            <option value="alliance">Alliance</option>
          </select>
        </label>
        <button className="back-btn">{t("Consultar", "Look up")}</button>
      </form>
      <LoadState {...r} retry={r.refresh}>
        {r.data ? (
          <div className="loot-table-scroll">
            <table className="loot-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("Guilda", "Guild")}</th>
                  <th>{t("Reino", "Realm")}</th>
                  <th>{t("Região", "Region")}</th>
                  <th>{t("Conclusão", "Completed")}</th>
                </tr>
              </thead>
              <tbody>
                {list(r.data.entries).map((entry, index) => (
                  <tr key={index}>
                    <td>{num(entry.rank)}</td>
                    <td>{label(entry.guild)}</td>
                    <td>{label(obj(entry.guild).realm)}</td>
                    <td>{str(entry.region).toUpperCase()}</td>
                    <td>
                      {new Date(num(entry.timestamp)).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </LoadState>
    </>
  );
}
