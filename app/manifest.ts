import type { MetadataRoute } from "next";

/** Lets phones "Add to Home Screen" (needed for iPhone alerts) and open FollowUp like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FollowUp",
    short_name: "FollowUp",
    description: "Every job request in one place. Every morning, one list of who to call and why.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
