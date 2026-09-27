export default function manifest() {
  return {
    name: "ORENTEMIST Admin",
    short_name: "ORENTEMIST Admin",
    description: "ORENTEMIST Administration Dashboard",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}