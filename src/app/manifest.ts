import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "fit^3",
    short_name: "fit^3",
    description: "Workouts built from the equipment at your gym.",
    start_url: "/",
    display: "standalone",
    background_color: "#101113",
    theme_color: "#101113",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
