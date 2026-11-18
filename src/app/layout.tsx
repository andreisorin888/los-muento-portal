import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { NextAuthProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: { default: "LOS MUENTO", template: "%s | LOS MUENTO" },
  description: "Portalul organizației LOS MUENTO",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#07050c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=Rajdhani:wght@500;600;700&display=swap"
        />
      </head>
      <body>
        <NextAuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
