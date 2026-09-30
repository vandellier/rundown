import type { Metadata } from "next";
import { Newsreader, Outfit } from "next/font/google";
import Script from "next/script";
import { Shell } from "@/components/shell";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: {
    default: "Rundown",
    template: "%s · Rundown",
  },
  description:
    "A personal, ad-free news channel. Pick topics and sources, then let the videos play through.",
  robots: { index: false, follow: false },
  applicationName: "Rundown",
};

const themeScript = `try{var t=localStorage.getItem('hs-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';}catch(e){document.documentElement.dataset.theme='dark';}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable} h-full`} suppressHydrationWarning>
      <body className="h-full antialiased">
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
