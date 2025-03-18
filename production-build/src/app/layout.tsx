// src/app/layout.tsx
import "./globals.css";
import { Providers } from "./providers";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import { SessionProvider } from '@/components/providers/SessionProvider';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MatchUp Fantasy App",
  description: "Play fantasy sports for pickleball tournaments and win prizes",
  keywords: ["fantasy", "pickleball", "tournaments", "sports"],
  authors: [{ name: "Priyanshu Saraf", url: "https://priyanshusaraf.com" }],
  creator: "Priyanshu Saraf",
  publisher: "MatchUp",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "MatchUp",
    description: "Play fantasy sports for pickleball tournaments and win prizes",
    siteName: "MatchUp",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchUp",
    description: "Play fantasy sports for pickleball tournaments and win prizes",
    creator: "@priyanshusaraf",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans`}
      suppressHydrationWarning
    >
      <body>
        <SessionProvider>
          <Providers>{children}</Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
