import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { GlassThemeController } from "@/components/GlassThemeController";
import { ChairmanCopilotHUD } from "@/components/chairman/copilot/ChairmanCopilotHUD";
import { DittoGengarPals } from "@/components/chairman/pixel-pals/DittoGengarPals";

export const metadata: Metadata = {
  title: "Chairman Dashboard — Pristine Command",
  description: "Chairman Dashboard Executive Command OS — Atmospheric Consumer-Tech Interface",
  applicationName: "Chairman Dashboard",
  appleWebApp: {
    capable: true,
    title: "Command",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [{ url: "/icons/icon-192.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect hints for Google Fonts imported in globals.css */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* iOS PWA — splash / status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Command" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* MS Tile (Windows/Edge PWA) */}
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen antialiased overscroll-none selection:bg-[#4984fd]/20">
        <Providers>
          <GlassThemeController />
          {children}
          <DittoGengarPals />
          <ChairmanCopilotHUD />
        </Providers>
      </body>
    </html>
  );
}
