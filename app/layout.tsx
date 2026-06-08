import type { Metadata, Viewport } from "next";
import PWARegister from "@/components/PWARegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruangku",
  description:
    "Your personal life management space — finance, goals, and notes in one place.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fafafa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-zinc-100 text-zinc-900 font-sans antialiased selection:bg-zinc-200">
        <PWARegister />
        <div className="mx-auto w-full max-w-[430px] min-h-screen bg-white shadow-[0_0_40px_rgba(0,0,0,0.06)]">
          {children}
        </div>
      </body>
    </html>
  );
}
