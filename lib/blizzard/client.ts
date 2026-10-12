import { assetPath } from "@/lib/paths";
export type Locale = "en_US" | "pt_BR";
export async function fetchBlizzard<T>(
  resource: string,
  locale: Locale,
  signal?: AbortSignal,
): Promise<T> {
  const query = new URLSearchParams({ path: "/data/wow/" + resource, locale });
  const response = await fetch(assetPath("/api/blizzard") + "?" + query, {
    signal,
  });
  if (!response.ok)
    throw new Error(
      locale === "pt_BR"
        ? "Não foi possível carregar os dados. Tente novamente."
        : "Unable to load data. Please try again.",
    );
  return response.json() as Promise<T>;
}
