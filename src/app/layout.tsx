import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/800";
import type { Metadata, Viewport } from "next";
import { AppFrame } from "@/components/AppFrame";
import "./globals.css";

export const metadata: Metadata = {
  title: "fit^3",
  description: "Workouts built from the equipment at your gym.",
  appleWebApp: { capable: true, title: "fit^3" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#161c24",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
