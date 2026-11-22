import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { NoZoom } from "@/components/no-zoom";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { ScrollReset } from "@/components/scroll-reset";
import { ToastProvider } from "@/components/toast";
import { THEME_KEY } from "@/lib/theme";
import { TrpcProvider } from "@/lib/trpc-client";
import "@/styles/app.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HRIS",
  description: "Laporan dan penugasan tim Saeful Askar",
  appleWebApp: { capable: true, title: "HRIS", statusBarStyle: "default" },
  // Generated from public/icons/Icon.png by scripts/generate-icons.mjs (CHANGELOG 64).
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // CHANGELOG 25. Android honors these; Safari iOS needs NoZoom as well.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#EE7A1F",
};

// CHANGELOG 47: a theme picked with ThemeToggle is applied before the first paint, so the page never
// flashes the other theme. Without a pick, the CSS follows the device setting as before.
const APPLY_SAVED_THEME = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The saved-theme script sets data-theme before React hydrates, so the attribute may differ.
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPLY_SAVED_THEME }} />
      </head>
      <body>
        <TrpcProvider>
          <ToastProvider>
            <div className="app-frame">
              <div id="app">
                <div className="scroll" id="scr">
                  {children}
                </div>
              </div>
            </div>
          </ToastProvider>
        </TrpcProvider>
        <ScrollReset />
        <NoZoom />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
