import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moliya — do‘kon hisoboti",
    short_name: "Moliya",
    description: "Do‘kon savdo va xarajat hisoboti",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f7f5",
    theme_color: "#0d604a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
