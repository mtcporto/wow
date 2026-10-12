export type Value = string | number | boolean | null | RecordValue | Value[];
export interface RecordValue {
  [key: string]: Value | undefined;
}
export const obj = (value: Value | undefined): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
export const list = (value: Value | undefined): RecordValue[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is RecordValue =>
          !!entry && typeof entry === "object" && !Array.isArray(entry),
      )
    : [];
export const str = (value: Value | undefined): string =>
  typeof value === "string" ? value : "";
export const num = (value: Value | undefined): number =>
  typeof value === "number" ? value : 0;
export const label = (value: Value | undefined) =>
  str(value) || str(obj(value).name);
export const quality = (value: Value | undefined) =>
  ({
    POOR: "#9d9d9d",
    COMMON: "#ffffff",
    UNCOMMON: "#1eff00",
    RARE: "#0070dd",
    EPIC: "#a335ee",
    LEGENDARY: "#ff8000",
    ARTIFACT: "#e6cc80",
    HEIRLOOM: "#00ccff",
  })[str(obj(value).type)] || "#ffffff";
export const money = (copper: number) =>
  `${Math.floor(copper / 10000)}g ${Math.floor(copper / 100) % 100}s ${Math.floor(copper) % 100}c`;
export const positive = (value: string | null) =>
  /^[1-9]\d{0,8}$/.test(value || "") ? Number(value) : 0;
export function profileLink(character: RecordValue, region: string) {
  const realm = obj(character.realm);
  return (
    "/characters?" +
    new URLSearchParams({
      region,
      realm: str(realm.slug),
      name: str(character.name).toLowerCase(),
    })
  );
}

export function questRewardGroups(rewards: RecordValue) {
  const items = obj(rewards.items);
  const normalize = (entries: RecordValue[]) =>
    entries
      .map((entry) => ({
        ...entry,
        item: num(obj(entry.item).id) ? obj(entry.item) : entry,
      }))
      .filter((entry) => num(entry.item.id) > 0);
  return {
    choice: normalize(list(items.choice_of)),
    received: normalize(
      Array.isArray(rewards.items) ? list(rewards.items) : list(items.received),
    ),
  };
}
