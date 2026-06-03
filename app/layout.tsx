import type { Metadata } from "next";
import { Space_Grotesk, Azeret_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const azeretMono = Azeret_Mono({
  subsets: ["latin"],
  variable: "--font-azeret-mono",
});

export const metadata: Metadata = {
  title: "S.A.D",
  description: "Stellar Account Demolisher — safe account migration, cleanup, and closure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${azeretMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
