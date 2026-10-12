"use client";
import { useLocale } from "./locale-provider";
export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="language-selector">
      <button
        id="lang-en"
        className={"language-btn" + (locale === "en_US" ? " active" : "")}
        onClick={() => setLocale("en_US")}
      >
        English (US)
      </button>
      <button
        id="lang-pt"
        className={"language-btn" + (locale === "pt_BR" ? " active" : "")}
        onClick={() => setLocale("pt_BR")}
      >
        Português (BR)
      </button>
    </div>
  );
}
