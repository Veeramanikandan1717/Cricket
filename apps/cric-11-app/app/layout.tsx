import type { Metadata } from "next";
import "@cricket/ui/styles/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cricket Admin",
  description: "Admin operations for matches, players and tournaments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
