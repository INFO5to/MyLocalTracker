import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LocalTracker",
    short_name: "Tracker",
    description:
      "Seguimiento de pedidos en tiempo real para negocios pequenos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6efe7",
    theme_color: "#eb6a42",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
