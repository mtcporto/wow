import type { Metadata } from "next";
import { LocaleProvider } from "@/components/locale-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Azeroth Explorer", template: "%s — Azeroth Explorer" },
  description:
    "Explore classes, talentos e coleções de World of Warcraft. Uma base para criar e compartilhar builds.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>
          <div className="container">
            <SiteHeader />
            {children}
            <footer className="site-footer">
              Azeroth Explorer
              <span>
                World of Warcraft © Blizzard · Projeto independente de fãs
              </span>
            </footer>
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
