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
import { ToyCatalogue } from "./toys";
import { useResource } from "./use-resource";
import {
  label,
  list,
  money,
  num,
  obj,
  positive,
  questRewardGroups,
  str,
  type RecordValue,
} from "./data";
import { assetPath } from "@/lib/paths";
export function Toys() {
  const p = useSearchParams(),
    id = positive(p.get("id")),
    t = useText(),
    r = useResource(id ? "toy/" + id : null),
    data = r.data;
  return (
    <FeatureShell
      title={
        id
          ? label(data?.name || obj(data?.item).name) || t("Brinquedo", "Toy")
          : t("Brinquedos", "Toys")
      }
      intro={t(
        "Explore brinquedos e os itens usados para adicioná-los à coleção.",
        "Explore toys and the items used to add them to a collection.",
      )}
    >
      <LoadState {...r} retry={r.refresh}>
        {id ? (
          <>
            <p className="native-description">{str(data?.description)}</p>
            <p>{str(data?.source_description)}</p>
            <Tags
              values={[
                label(data?.source),
                label(data?.faction),
                label(data?.species),
              ]}
            />
            {num(obj(data?.item).id) ? (
              <ItemLink item={obj(data?.item)} />
            ) : null}
            <p>
              <a href={assetPath("/toys")}>
                {t("Todos os brinquedos", "All toys")}
              </a>
            </p>
          </>
        ) : (
          <ToyCatalogue />
        )}
      </LoadState>
    </FeatureShell>
  );
}
export function Reputations() {
  const p = useSearchParams(),
    id = positive(p.get("id")),
    tiers =
      p.has("tiers") && /^\d{1,9}$/.test(p.get("tiers") || "")
        ? Number(p.get("tiers"))
        : null,
    t = useText(),
    r = useResource(
      tiers !== null
        ? "reputation-tiers/" + tiers
        : "reputation-faction/" + (id || "index"),
    ),
    data = r.data;
  const ranks = list(data?.tiers);
  return (
    <FeatureShell
      title={label(data?.name) || t("Reputações", "Reputations")}
      intro={t(
        "Conheça facções, vínculos e níveis de reputação.",
        "Explore factions, connections and reputation standings.",
      )}
    >
      <LoadState {...r} retry={r.refresh}>
        {id || tiers !== null ? (
          <>
            <p>{str(data?.description)}</p>
            <Tags values={[label(data?.player_faction)]} />
            {num(obj(data?.parent_faction).id) ? (
              <a
                className="back-btn"
                href={assetPath(
                  "/reputations?id=" + obj(data?.parent_faction).id,
                )}
              >
                {label(data?.parent_faction)}
              </a>
            ) : null}
            {list(data?.factions).length ? (
              <ReferenceList
                entries={list(data?.factions)}
                href={(entry) => "/reputations?id=" + entry.id}
              />
            ) : null}
            {typeof obj(data?.reputation_tiers).id === "number" ? (
              <p>
                <a
                  href={assetPath(
                    "/reputations?tiers=" + obj(data?.reputation_tiers).id,
                  )}
                >
                  {t("Ver níveis de reputação", "View reputation standings")}
                </a>
              </p>
            ) : null}
            {ranks.length ? (
              <div className="loot-table-scroll">
                <table className="loot-table">
                  <thead>
                    <tr>
                      <th>{t("Nível", "Standing")}</th>
                      <th>{t("Mínimo", "Minimum")}</th>
                      <th>{t("Máximo", "Maximum")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranks.map((rank, index) => (
                      <tr key={index}>
                        <td>{label(rank.name)}</td>
                        <td>{num(rank.min_value)}</td>
                        <td>{num(rank.max_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <p>
              <a href={assetPath("/reputations")}>
                {t("Todas as facções", "All factions")}
              </a>
            </p>
          </>
        ) : (
          <ReferenceList
            entries={list(data?.factions)}
            href={(entry) => "/reputations?id=" + entry.id}
          />
        )}
      </LoadState>
    </FeatureShell>
  );
}
export function Quests() {
  const p = useSearchParams(),
    t = useText(),
    id = positive(p.get("id")),
    group = ["area", "category", "type"].includes(p.get("group") || "")
      ? p.get("group")!
      : "area",
    groupId = positive(p.get("groupId")),
    r = useResource(
      id ? "quest/" + id : "quest/" + group + "/" + (groupId || "index"),
    ),
    data = r.data;
  return (
    <FeatureShell
      title={
        label(
          data?.title ||
            data?.name ||
            data?.area ||
            data?.category ||
            data?.type,
        ) || t("Missões", "Quests")
      }
      intro={
        id
          ? ""
          : t(
              "Explore missões por área, categoria ou tipo e consulte os requisitos e recompensas.",
              "Browse quests by area, category or type, with requirements and rewards.",
            )
      }
    >
      <nav
        className="quest-browse-nav"
        aria-label={t("Explorar missões", "Browse quests")}
      >
        {["area", "category", "type"].map((key, index) => (
          <a
            className="back-btn"
            key={key}
            href={assetPath("/quests?group=" + key)}
          >
            {
              [
                t("Áreas", "Areas"),
                t("Categorias", "Categories"),
                t("Tipos", "Types"),
              ][index]
            }
          </a>
        ))}
      </nav>
      <LoadState {...r} retry={r.refresh}>
        {id ? (
          <QuestDetail data={data || {}} />
        ) : groupId ? (
          <ReferenceList
            entries={list(data?.quests)}
            href={(entry) => "/quests?id=" + entry.id}
          />
        ) : (
          <ReferenceList
            entries={list(data?.areas || data?.categories || data?.types)}
            href={(entry) => "/quests?group=" + group + "&groupId=" + entry.id}
          />
        )}
      </LoadState>
    </FeatureShell>
  );
}
function QuestDetail({ data }: { data: RecordValue }) {
  const t = useText(),
    requirements = obj(data.requirements),
    rewards = obj(data.rewards),
    groups = questRewardGroups(rewards);
  const facts = [
    [t("ID da missão", "Quest ID"), String(num(data.id))],
    [t("Facção", "Faction"), label(requirements.faction)],
    [
      t("Nível mínimo", "Minimum level"),
      num(requirements.min_character_level)
        ? String(num(requirements.min_character_level))
        : "",
    ],
    [
      t("Nível máximo", "Maximum level"),
      num(requirements.max_character_level)
        ? String(num(requirements.max_character_level))
        : "",
    ],
    [t("Categoria", "Category"), label(data.category)],
    [t("Tipo", "Type"), label(data.type)],
  ];
  return (
    <div className="quest-layout">
      <div className="quest-content">
        {list(data.objectives).length ? (
          <section className="quest-section">
            <h2>{t("Objetivos", "Objectives")}</h2>
            {list(data.objectives).map((objective, index) => (
              <p key={index}>
                {str(
                  objective.display_string ||
                    objective.description ||
                    objective.text,
                )}
              </p>
            ))}
          </section>
        ) : null}
        {str(data.description) || str(data.details) ? (
          <section className="quest-section">
            <h2>{t("Descrição", "Description")}</h2>
            {str(data.description) ? (
              <p className="native-description">{str(data.description)}</p>
            ) : null}
            {str(data.details) ? (
              <p className="native-description">{str(data.details)}</p>
            ) : null}
          </section>
        ) : null}
        {groups.choice.length ||
        groups.received.length ||
        num(rewards.experience) ||
        num(obj(rewards.money).value) ||
        list(rewards.reputations).length ? (
          <section className="quest-section">
            <h2>{t("Recompensas", "Rewards")}</h2>
            {groups.choice.length ? (
              <QuestRewardItems entries={groups.choice} choice />
            ) : null}
            {groups.received.length ? (
              <QuestRewardItems entries={groups.received} />
            ) : null}
            <div className="quest-gains">
              {num(obj(rewards.money).value) ? (
                <p>
                  {t("Dinheiro: ", "Money: ") +
                    money(num(obj(rewards.money).value))}
                </p>
              ) : null}
              {num(rewards.experience) ? (
                <p>
                  {t("Experiência: ", "Experience: ") + num(rewards.experience)}
                </p>
              ) : null}
              {list(rewards.reputations).map((reward, index) => (
                <p key={index}>
                  <a
                    href={assetPath(
                      "/reputations?id=" +
                        obj(reward.reward || reward.faction).id,
                    )}
                  >
                    {label(reward.reward || reward.faction)}
                  </a>{" "}
                  +{num(reward.value)} {t("de reputação", "reputation")}
                </p>
              ))}
            </div>
          </section>
        ) : null}
        <p>
          <a href={assetPath("/quests")}>
            {t("Explorar outras missões", "Explore more quests")}
          </a>
        </p>
      </div>
      <aside className="quest-facts" aria-labelledby="quest-facts-title">
        <h2 id="quest-facts-title">
          {t("Informações rápidas", "Quick facts")}
        </h2>
        <dl>
          {num(obj(data.area).id) ? (
            <>
              <dt>{t("Área", "Area")}</dt>
              <dd>
                <a
                  href={assetPath(
                    "/quests?group=area&groupId=" + obj(data.area).id,
                  )}
                >
                  {label(data.area)}
                </a>
              </dd>
            </>
          ) : null}
          {facts
            .filter(([, value]) => value)
            .map(([title, value]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
      </aside>
    </div>
  );
}
function QuestRewardItems({
  entries,
  choice = false,
}: {
  entries: RecordValue[];
  choice?: boolean;
}) {
  const t = useText();
  return (
    <div className="quest-reward-group">
      <h3>
        {choice
          ? t("Escolha uma destas recompensas", "Choose one of these rewards")
          : t("Você receberá", "You will receive")}
      </h3>
      <div className="quest-reward-items">
        {entries.map((entry, index) => {
          const item = obj(entry.item),
            specs = list(obj(entry.requirements).playable_specializations);
          return (
            <article className="quest-reward-item" key={num(item.id) || index}>
              <ItemLink item={item} />
              {num(entry.quantity) > 1 ? (
                <span> ×{num(entry.quantity)}</span>
              ) : null}
              {specs.length ? (
                <p className="quest-reward-requirements">
                  <span>{t("Especializações: ", "Specializations: ")}</span>
                  {specs.map((spec, i) => (
                    <span key={num(spec.id)}>
                      {i > 0 ? " · " : ""}
                      <a href={assetPath("/explore?spec=" + spec.id)}>
                        {label(spec.name)}
                      </a>
                    </span>
                  ))}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
