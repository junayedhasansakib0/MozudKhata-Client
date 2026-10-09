import type { Metadata } from "next";
import { Manrope, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MozudKhata",
    template: "%s · MozudKhata",
  },
  description: "Global Cloud POS & Inventory Management SaaS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // dir defaults to ltr; swap to "rtl" per active locale when i18n lands (RTL readiness).
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${hanken.variable} ${manrope.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
