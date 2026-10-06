import type { NextConfig } from "next";
import { TOUR_VIDEO } from "./lib/media";

const nextConfig: NextConfig = {
  // Old links to the video keep working after it moved out of the repo.
  async redirects() {
    return [
      { source: "/explainer.mp4", destination: TOUR_VIDEO, permanent: false },
      { source: "/walkthrough.mp4", destination: TOUR_VIDEO, permanent: false },
    ];
  },
};

export default nextConfig;
