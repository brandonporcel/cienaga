import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

import EasterEgg from "./easter-egg";
import ThemeInitializer from "./theme-initializer";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appDescription =
  "Enterate cuando se dan tus pelis favoritas en cines de Buenos Aires";
const appShortTitle = "Ciénaga: Tus Pelis En Cines";
const appUrl = "https://cienaga.vercel.app";
export const metadata: Metadata = {
  title: "Ciénaga | Tus Pelis En Cines",
  description: appDescription,
  keywords: ["peliculas", "cine", "buenos aires", "letterboxd"],
  authors: { name: "Brandon Porcel", url: "https://github.com/brandonporcel" },
  creator: "Brandon Porcel",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: appShortTitle,
    description: appDescription,
    siteName: "Kindle Lyrics",
    images: [
      {
        url: `${appUrl}/og.png`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: appShortTitle,
    description: appDescription,
    images: [
      {
        url: `${appUrl}/og.png`,
        width: 1200,
        height: 630,
      },
    ],
  },
  icons: [
    {
      type: "favicon",
      url: "favicon.ico",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange={false}
        >
          <ThemeInitializer />
          <EasterEgg />
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
