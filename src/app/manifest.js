export default function manifest() {
  return {
    name: "Gatronova Trucking Portal",
    short_name: "Gatronova Trucking Portal",
    description: "Freight collection and RFQ portal – works offline",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    scope: "/",
    id: "/",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [],
    prefer_related_applications: false,
  };
}
