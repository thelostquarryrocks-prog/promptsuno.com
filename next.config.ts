import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Preview branch only: serve the Claude Design landing page export at "/".
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/design-preview/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
