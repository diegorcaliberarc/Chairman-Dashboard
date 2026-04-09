import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Pristine Command",
  description: "Pristine Designs Executive Command Dashboard — One Step Closer 2026",
  applicationName: "Pristine Command",
  appleWebApp: {
    capable: true,
    title: "Command",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon.svg",     type: "image/svg+xml" },
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
  themeColor: "#C9A961",
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
        {/* iOS PWA — splash / status bar */}
        <meta name="apple-mobile-web-app-capable"           content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style"  content="black-translucent" />
        <meta name="apple-mobile-web-app-title"             content="Command" />
        <meta name="mobile-web-app-capable"                 content="yes" />

        {/* Prevent phone-number link detection */}
        <meta name="format-detection" content="telephone=no" />

        {/* MS Tile (Windows/Edge PWA) */}
        <meta name="msapplication-TileColor"   content="#08090C" />
        <meta name="msapplication-TileImage"   content="/icons/icon-192.png" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple touch icon (fallback explicit tag for older iOS) */}
        <link rel="apple-touch-icon"              href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />

        {/* iOS Splash Screens — iPhone 15 Pro Max → iPhone SE */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"  href="/icons/splash-1290x2796.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"  href="/icons/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"  href="/icons/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"  href="/icons/splash-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"  href="/icons/splash-1242x2688.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"  href="/icons/splash-750x1334.png" />
      </head>
      <body className="min-h-screen bg-[#08090C] text-slate-200 antialiased overscroll-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
