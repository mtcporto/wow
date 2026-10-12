import type { NextConfig } from "next";
const config: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async rewrites() {
    return [
      { source: "/index.html", destination: "/" },
      { source: "/pets.html", destination: "/pets" },
      { source: "/explore.html", destination: "/explore" },
    ];
  },
};
export default config;
