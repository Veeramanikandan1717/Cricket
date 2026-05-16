import type { Metadata } from "next";
import "@cricket/ui/styles/tokens.css";
import "./globals.css";
import AppProviders from "@/providers/appProviders";

export const metadata: Metadata = {
  title: "Cricket Hub",
  description: "Live scorecards, players, tournaments and points table",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
