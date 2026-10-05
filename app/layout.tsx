import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const url = process.env.APP_URL ?? "http://localhost:3200";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: "FollowUp: every job request, one morning list", template: "%s · FollowUp" },
  description:
    "Calls, texts, web forms and the notebook in one place. FollowUp tells a service business who to call today and why, emergencies first.",
  applicationName: "FollowUp",
  keywords: ["field service", "follow-up", "quotes", "call list", "refrigeration repair", "small business"],
  openGraph: {
    type: "website",
    siteName: "FollowUp",
    title: "FollowUp: every job request, one morning list",
    description: "Know who to call today, and why. Built for small service businesses.",
  },
  twitter: { card: "summary_large_image", title: "FollowUp", description: "Know who to call today, and why." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f8fa" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
