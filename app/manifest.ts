import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SwarnaTry — AI Gold Virtual Try-On & Goldsmith Estimator",
    short_name: "SwarnaTry",
    description:
      "Luxury bridal & heritage gold virtual AR try-on, 5-piece bridal combo layering, 3D neck-curve warping, old gold trade-in calculations, and live 22K bullion pricing for shoppers and showroom kiosks.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B0E",
    theme_color: "#D4AF37",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
