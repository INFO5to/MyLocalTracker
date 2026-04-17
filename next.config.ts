import type { NextConfig } from "next";

function readAllowedDevOrigins() {
  const candidates = [
    process.env.TRACKING_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter((value): value is string => Boolean(value));

  const allowedHosts = new Set<string>();

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);

      if (
        url.hostname &&
        !["localhost", "127.0.0.1", "::1"].includes(url.hostname)
      ) {
        allowedHosts.add(url.hostname);
      }
    } catch {
      // Ignore malformed URLs in env and keep the config booting.
    }
  }

  return [...allowedHosts];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: readAllowedDevOrigins(),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
