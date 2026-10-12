import { assetPath } from "@/lib/paths";
export type Locale = "en_US" | "pt_BR";
export async function fetchBlizzard<T>(
  resource: string,
  locale: Locale,
  signal?: AbortSignal,
  region: string = "us",
  extra: Record<string,string> = {},
): Promise<T> {
  const query = new URLSearchParams({ path: resource.startsWith("/profile/")?resource:"/data/wow/" + resource, locale, region, ...extra });
  const response = await fetch(assetPath("/api/blizzard") + "?" + query, {
    signal,
  });
  if (!response.ok)
    throw new Error(response.status===404?(locale==="pt_BR"?"Nenhum dado público encontrado para esta consulta.":"No public data found for this lookup."):
      locale === "pt_BR"
        ? "Não foi possível carregar os dados. Tente novamente."
        : "Unable to load data. Please try again.",
    );
  return response.json() as Promise<T>;
}
