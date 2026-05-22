import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppNav } from "@/components/app-nav";

export const metadata: Metadata = {
  title: "Circle Court",
  description: "Agent-native decentralized dispute resolution on Arc Testnet with Circle Agent Stack."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>
          <AppNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
