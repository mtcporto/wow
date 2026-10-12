"use client";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/blizzard/client";
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (value: Locale) => void;
}>({ locale: "en_US", setLocale: () => {} });
const subscribe = (listener: () => void) => {
  window.addEventListener("wow:language", listener);
  return () => window.removeEventListener("wow:language", listener);
};
const snapshot = (): Locale =>
  sessionStorage.getItem("wow-language") === "pt_BR" ? "pt_BR" : "en_US";
const serverSnapshot = (): Locale => "en_US";
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  function setLocale(value: Locale) {
    sessionStorage.setItem("wow-language", value);
    window.dispatchEvent(new Event("wow:language"));
  }
  useEffect(() => {
    document.documentElement.lang = locale === "pt_BR" ? "pt-BR" : "en";
  }, [locale]);
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
export const useLocale = () => useContext(LocaleContext);
