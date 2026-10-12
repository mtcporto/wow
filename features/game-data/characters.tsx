"use client";
import { useSearchParams } from "next/navigation";
import {
  FeatureShell,
  LoadState,
  ReferenceList,
  Tags,
  useText,
} from "./common";
import { ItemLink } from "./item-link";
import { useResource } from "./use-resource";
import { label, list, num, obj, str, type RecordValue } from "./data";
import { assetPath } from "@/lib/paths";
const tabs = [
  "equipment",
  "specializations",
  "reputations",
  "quests/completed",
  "collections/mounts",
  "collections/pets",
];
export function Characters() {
  const p = useSearchParams(),
    t = useText(),
    region = ["us", "eu", "kr", "tw"].includes(p.get("region") || "")
      ? p.get("region")!
      : "us",
    realm = (p.get("realm") || "").toLowerCase(),
    name = (p.get("name") || "").toLowerCase(),
    tab = tabs.includes(p.get("tab") || "") ? p.get("tab")! : "";
  const valid =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(realm) && /^[\p{L}]{2,12}$/u.test(name);
  const path = "/profile/wow/character/" + realm + "/" + name;
  const profile = useResource(valid ? path : null, region),
    detail = useResource(valid && tab ? path + "/" + tab : null, region),
    media = useResource(valid ? path + "/character-media" : null, region);
  const data = profile.data,
    asset =
      list(media.data?.assets).find((a) => a.key === "main-raw") ||
      list(media.data?.assets).find((a) => a.key === "main") ||
      list(media.data?.assets).find((a) => a.key === "avatar");
  const url = (nextTab: string) =>
    "/characters?" +
    new URLSearchParams({
      region,
      realm,
      name,
      ...(nextTab ? { tab: nextTab } : {}),
    });
  return (
    <FeatureShell
      title={
        label(data?.name) || t("Perfis de personagens", "Character profiles")
      }
      intro={t(
        "Consulte os dados públicos de um personagem por região, reino e nome.",
        "Look up a character’s public data by region, realm and name.",
      )}
    >
      <form className="native-query-form" action={assetPath("/characters")}>
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
          {t("Reino (slug)", "Realm (slug)")}
          <input
            name="realm"
            defaultValue={realm}
            placeholder="azralon"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
            maxLength={80}
          />
        </label>
        <label>
          {t("Personagem", "Character")}
          <input
            name="name"
            defaultValue={name}
            required
            minLength={2}
            maxLength={12}
          />
        </label>
        <button className="back-btn">
          {t("Buscar perfil", "Find character")}
        </button>
      </form>
      {valid ? (
        <LoadState {...profile} retry={profile.refresh}>
          {data ? (
            <>
              <div className="character-summary">
                {str(asset?.value).startsWith("https://") ? (
                  <img
                    src={
                      asset?.key === "main-raw"
                        ? assetPath(
                            "/api/character-image?" +
                              new URLSearchParams({ src: str(asset.value) }),
                          )
                        : str(asset?.value)
                    }
                    onError={(event) => {
                      const original = str(asset?.value);
                      if (
                        event.currentTarget.getAttribute("data-original") !==
                        original
                      ) {
                        event.currentTarget.setAttribute(
                          "data-original",
                          original,
                        );
                        event.currentTarget.src = original;
                      }
                    }}
                    alt={label(data.name)}
                    width={300}
                    height={360}
                  />
                ) : null}
                <div>
                  <Tags
                    values={[
                      label(data.race),
                      label(data.character_class),
                      label(data.active_spec),
                      label(data.faction),
                      t("Nível ", "Level ") + data.level,
                      label(data.realm),
                      label(data.guild),
                    ]}
                  />
                  <p>
                    {t("Pontos de conquista: ", "Achievement points: ") +
                      num(data.achievement_points)}
                  </p>
                  <p>
                    {t("Nível médio de equipamento: ", "Average item level: ") +
                      num(data.average_item_level)}
                  </p>
                  {num(obj(data.active_spec).id) ? (
                    <a
                      className="back-btn"
                      href={assetPath(
                        "/explore?spec=" + obj(data.active_spec).id,
                      )}
                    >
                      {t("Explorar especialização", "Explore specialization")}
                    </a>
                  ) : null}
                </div>
              </div>
              <nav
                className="native-tabs"
                aria-label={t("Dados do personagem", "Character data")}
              >
                {["", ...tabs].map((key, index) => (
                  <a
                    key={key}
                    className="back-btn"
                    aria-current={key === tab ? "page" : undefined}
                    href={assetPath(url(key))}
                  >
                    {
                      [
                        t("Resumo", "Overview"),
                        t("Equipamento", "Equipment"),
                        t("Especializações", "Specializations"),
                        t("Reputações", "Reputations"),
                        t("Missões concluídas", "Completed quests"),
                        t("Montarias", "Mounts"),
                        t("Mascotes", "Pets"),
                      ][index]
                    }
                  </a>
                ))}
              </nav>
              {tab ? (
                <LoadState {...detail} retry={detail.refresh}>
                  <CharacterDetail
                    tab={tab}
                    data={detail.data || {}}
                    region={region}
                  />
                </LoadState>
              ) : null}
            </>
          ) : null}
        </LoadState>
      ) : p.has("name") ? (
        <p className="error">
          {t(
            "Informe um reino e um nome de personagem válidos.",
            "Enter a valid realm and character name.",
          )}
        </p>
      ) : null}
    </FeatureShell>
  );
}
function CharacterDetail({
  tab,
  data,
  region,
}: {
  tab: string;
  data: RecordValue;
  region: string;
}) {
  const t = useText();
  if (tab === "equipment")
    return (
      <div className="relation-grid">
        {list(data.equipped_items).map((entry, index) => (
          <article className="relation-card" key={index}>
            <p>{label(entry.slot)}</p>
            <ItemLink
              item={{
                ...obj(entry.item),
                name: entry.name || obj(entry.item).name,
                quality: entry.quality,
              }}
              region={region}
              preview={entry}
            />
            <p>
              {label(entry.quality)} · {str(obj(entry.level).display_string)}
            </p>
          </article>
        ))}
      </div>
    );
  if (tab === "specializations")
    return (
      <div className="relation-grid">
        {list(data.specializations).map((entry, index) => (
          <a
            className="relation-card"
            href={assetPath("/explore?spec=" + obj(entry.specialization).id)}
            key={index}
          >
            <h3>{label(entry.specialization)}</h3>
            {entry.is_active ? (
              <span className="tag">{t("Ativa", "Active")}</span>
            ) : null}
          </a>
        ))}
      </div>
    );
  if (tab === "reputations")
    return (
      <div className="loot-table-scroll">
        <table className="loot-table">
          <thead>
            <tr>
              <th>{t("Facção", "Faction")}</th>
              <th>{t("Reputação", "Standing")}</th>
              <th>{t("Progresso", "Progress")}</th>
            </tr>
          </thead>
          <tbody>
            {list(data.reputations).map((entry, index) => (
              <tr key={index}>
                <td>
                  <a
                    href={assetPath("/reputations?id=" + obj(entry.faction).id)}
                  >
                    {label(entry.faction)}
                  </a>
                </td>
                <td>{label(obj(entry.standing).name)}</td>
                <td>
                  {num(obj(entry.standing).max) > 0
                    ? `${num(obj(entry.standing).value)} / ${num(obj(entry.standing).max)}`
                    : num(obj(entry.standing).raw)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if (tab === "quests/completed")
    return (
      <ReferenceList
        entries={list(data.quests || data.completed_quests)}
        href={(entry) => "/quests?id=" + entry.id}
      />
    );
  if (tab === "collections/mounts")
    return (
      <ReferenceList
        entries={list(data.mounts).map((entry) => obj(entry.mount))}
        href={(entry) => "/explore?mount=" + entry.id}
      />
    );
  if (tab === "collections/pets")
    return (
      <>
        <p>
          {list(data.pets).length +
            " " +
            t("mascotes nesta coleção", "pets in this collection")}
        </p>
        <ReferenceList
          entries={list(data.pets).map((entry) => ({
            ...obj(entry.species),
            name: entry.name || obj(entry.species).name,
            keyId: String(entry.id),
          }))}
          href={() => "/pets"}
        />
      </>
    );
  return null;
}
