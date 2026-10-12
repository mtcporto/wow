"use client";
import { useEffect, useRef } from "react";
import { assetPath, basePath } from "@/lib/paths";
declare global {
  interface Window {
    WowConfig: { basePath: string };
  }
}
const scripts = {
  pets: ["pets.js", "catalogue.js"],
  explore: [
    "explorer-data.js",
    "wow-tooltip.js",
    "talent-tree.js",
    "explorer.js",
  ],
} as const;
/** Compatibility boundary during migration. Pages use full-document navigation so
 * DOM-owned catalogue engines cannot survive into another React page. Replace
 * each engine with React state before introducing client-side navigation here. */
export function CatalogueRuntime({ kind }: { kind: keyof typeof scripts }) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    window.WowConfig = { basePath };
    const load = async () => {
      for (const file of scripts[kind])
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = assetPath("/legacy/" + file);
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Unable to load catalogue interface"));
          document.body.appendChild(script);
        });
    };
    load().catch(() => {
      const output = document.getElementById("output");
      if (output) {
        output.className = "error";
        output.textContent =
          "Não foi possível carregar a interface. Atualize a página.";
        output.setAttribute("aria-busy", "false");
      }
    });
  }, [kind]);
  return null;
}
