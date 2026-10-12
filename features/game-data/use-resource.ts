"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { fetchBlizzard } from "@/lib/blizzard/client";
import type { RecordValue } from "./data";
const cache = new Map<string, { expires: number; data: RecordValue }>();
export function useResource(
  resource: string | null,
  region = "us",
  extra: Record<string, string> = {},
) {
  const { locale } = useLocale(),
    serialized = JSON.stringify(extra),
    baseKey = resource + "|" + locale + "|" + region + "|" + serialized;
  const [retry, setRetry] = useState(0),
    key = baseKey + "|" + retry;
  const [state, setState] = useState<{
    key: string;
    data?: RecordValue;
    error?: string;
  }>({ key: "" });
  useEffect(() => {
    if (!resource) return;
    const controller = new AbortController(),
      stored = cache.get(baseKey);
    const request =
      stored && stored.expires > Date.now()
        ? Promise.resolve(stored.data)
        : fetchBlizzard<RecordValue>(
            resource,
            locale,
            controller.signal,
            region,
            JSON.parse(serialized),
          );
    request
      .then((data) => {
        if (controller.signal.aborted) return;
        cache.set(baseKey, { data, expires: Date.now() + 60000 });
        if (cache.size > 100) cache.delete(cache.keys().next().value!);
        setState({ key, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ key, error: error.message });
      });
    return () => controller.abort();
  }, [resource, locale, region, serialized, baseKey, key]);
  return {
    data: state.key === key ? state.data : null,
    error: state.key === key ? state.error : null,
    loading: !!resource && state.key !== key,
    refresh: () => {
      cache.delete(baseKey);
      setRetry((value) => value + 1);
    },
  };
}
