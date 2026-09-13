import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This app is fully client-side and privacy-first, so we can ship it as
     static files (served by any static host without a Node server). */
  output: "export",
};

export default nextConfig;
