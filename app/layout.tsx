import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const bodyFont = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-body",
  display: "swap",
});

const displayFont = localFont({
  src: "../node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "LocalTracker",
    template: "%s | LocalTracker",
  },
  description:
    "Seguimiento de pedidos en tiempo real para negocios pequenos con Next.js y Supabase.",
  applicationName: "LocalTracker",
  keywords: [
    "tracking",
    "seguimiento de pedidos",
    "supabase",
    "next.js",
    "pwa",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LocalTracker",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "LocalTracker",
    description:
      "Opera y comparte el seguimiento de pedidos en vivo desde una sola PWA.",
    siteName: "LocalTracker",
    type: "website",
    locale: "es_MX",
  },
};

const themeBootstrapScript = `
  (() => {
    try {
      const storedTheme = window.localStorage.getItem("localtracker-theme");
      const theme =
        storedTheme === "light" || storedTheme === "dark"
          ? storedTheme
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.dataset.theme = "light";
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full overflow-x-hidden">
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        {children}
      </body>
    </html>
  );
}
