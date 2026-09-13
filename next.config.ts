import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "ferf1mheo22r9ira.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "a.ltrbxd.com" },
      { protocol: "https", hostname: "lumiton.ar" },
      { protocol: "https", hostname: "malba.org.ar" },
    ],
  },
};

export default nextConfig;
