import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BoomoTech",
    short_name: "BoomoTech",
    description: "Practical technology support and smarter systems for your business.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#1d3a49",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
