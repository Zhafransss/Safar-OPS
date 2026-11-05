import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { RegisterServiceWorker } from "@/components/register-service-worker";
import { TrpcProvider } from "@/lib/trpc-client";
import "@/styles/app.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAFAR OPS 2",
  description: "Laporan dan penugasan tim Saeful Askar",
  appleWebApp: { capable: true, title: "SAFAR OPS 2", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#EE7A1F",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body>
        <TrpcProvider>
          <div className="app-frame">
            <div id="app">
              <div className="scroll" id="scr">
                {children}
              </div>
            </div>
          </div>
        </TrpcProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
